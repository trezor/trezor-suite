import { type Event, type Message, type OpencodeClient } from '@opencode-ai/sdk';
import { mkdirSync } from 'node:fs';

import { log } from '../logger';
import { MODEL, OPENCODE_CONFIG, REASONING_EFFORT } from './opencodeConfig';
import { OPENCODE_CONFIG_DIR, REPO_ROOT } from './paths';
import { type TestResult, TestResultJsonSchema, TestResultSchema } from './schemas';

const SERVER_START_TIMEOUT_MS = 30_000;
// Continuations when the verdict reports unfinished coverage; the $ budget
// cap bounds the total across all of them.
const MAX_CONTINUATIONS = 3;

type RunOpencodeOptions = {
    prompt: string;
    timeoutMs: number;
    maxBudgetUsd: number;
};

function unwrap<T>(label: string, result: { data?: T; error?: unknown }): T {
    if (result.error !== undefined) {
        throw new Error(`${label}: ${JSON.stringify(result.error)}`);
    }
    if (result.data === undefined) {
        throw new Error(`${label} returned no data`);
    }

    return result.data;
}

// Reads are the only permission the agent can legitimately need; everything
// else is denied by config or the sandbox gate, so reject it loudly.
const APPROVED_PERMISSION_TYPES = new Set(['read']);

function handleEvent(client: OpencodeClient, event: Event): void {
    if (event.type === 'permission.updated') {
        const approved = APPROVED_PERMISSION_TYPES.has(event.properties.type);
        void client.postSessionIdPermissionsPermissionId({
            path: { id: event.properties.sessionID, permissionID: event.properties.id },
            body: { response: approved ? 'once' : 'reject' },
        });
        log(
            `[permission] ${approved ? 'approved' : 'REJECTED'} ${event.properties.type}: ${event.properties.title}`,
        );
        if (!approved) {
            log(`[permission] rejected detail: ${JSON.stringify(event.properties)}`);
        }

        return;
    }

    if (event.type === 'session.error') {
        log(`[session.error] ${JSON.stringify(event.properties)}`);

        return;
    }

    if (event.type !== 'message.part.updated') {
        return;
    }

    const { part, delta } = event.properties;
    if (part.type === 'text' && delta) {
        process.stderr.write(delta);
    }
    if (part.type === 'tool') {
        const detail = part.state.status === 'error' ? ` ${part.state.error}` : '';
        log(`[tool] ${part.tool} ${part.state.status}${detail}`);
    }
}

// The json_schema format makes the server attach the validated verdict to the
// final assistant message as `structured` — a field the v1 SDK types omit.
// No message with `structured` at all means the run broke — say so.
function parseStructuredOutput(messages: Message[]): TestResult {
    for (const info of messages.toReversed()) {
        if (info.role !== 'assistant') continue;

        const { structured } = info as { structured?: unknown };
        if (structured === undefined) continue;

        const parsed = TestResultSchema.safeParse(structured);
        if (!parsed.success) {
            throw new Error(`structured output failed TestResultSchema: ${parsed.error.message}`);
        }

        return parsed.data;
    }

    throw new Error('OpenCode ended without structured output');
}

type WatchRunParams = {
    client: OpencodeClient;
    sessionId: string;
    events: AsyncIterable<Event>;
    maxBudgetUsd: number;
    timeoutMs: number;
    // Abort means the kill timer fired — used only to word the final error.
    signal: AbortSignal;
    // Shared across continuations so the budget cap sees the cumulative cost.
    messages: Map<string, Message>;
};

// session.prompt holds one HTTP request open for the whole run and Node drops
// it after a while, so fire promptAsync and watch the event stream until the
// session goes idle. message.updated carries everything we need — per-step
// cost for the budget cap and the structured verdict — and session.messages
// is avoided on purpose: OpenCode 1.18 fails to re-validate the stored
// OutputFormat on read and answers 400.
async function watchRun({
    client,
    sessionId,
    events,
    maxBudgetUsd,
    timeoutMs,
    signal,
    messages,
}: WatchRunParams): Promise<void> {
    for await (const event of events) {
        handleEvent(client, event);
        if (event.type === 'message.updated') {
            const { info } = event.properties;
            if (info.sessionID !== sessionId) continue;
            messages.set(info.id, info);

            const totalCost = [...messages.values()].reduce(
                (sum, m) => sum + (m.role === 'assistant' ? m.cost : 0),
                0,
            );
            if (totalCost > maxBudgetUsd) {
                await client.session.abort({ path: { id: sessionId } });
                throw new Error(
                    `Agent budget exceeded: $${totalCost.toFixed(2)} > $${maxBudgetUsd}`,
                );
            }
        }
        if (event.type === 'session.idle' && event.properties.sessionID === sessionId) {
            return;
        }
    }

    if (signal.aborted) {
        throw new Error(`OpenCode timed out after ${timeoutMs / 60_000} min`);
    }

    throw new Error('OpenCode event stream ended before session.idle');
}

export async function runOpencode({
    prompt,
    timeoutMs,
    maxBudgetUsd,
}: RunOpencodeOptions): Promise<TestResult> {
    // The server inherits our env and reads OPENROUTER_API_KEY itself; fail
    // early with a clear message rather than a provider error mid-run.
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is required');
    }
    // The SDK spawns the server without a cwd option, and the MCP output dir
    // in OPENCODE_CONFIG is repo-relative.
    process.chdir(REPO_ROOT);
    // Isolate the server from the developer's global OpenCode config — it
    // inherits our env, and a global opencode.json would silently widen the
    // sandbox with extra MCP servers, plugins, or instructions.
    mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
    process.env.XDG_CONFIG_HOME = OPENCODE_CONFIG_DIR;

    // ESM-only package; this file is loaded as CJS by tsx.
    const { createOpencode } = await import('@opencode-ai/sdk');

    const abort = new AbortController();
    const killTimer = setTimeout(() => abort.abort(), timeoutMs);
    let server: { url: string; close(): void } | undefined;
    try {
        // Port 0: the OS assigns a free one, so a developer's own OpenCode on
        // the default port is never hijacked (and we never EADDRINUSE).
        const created = await createOpencode({
            port: 0,
            signal: abort.signal,
            timeout: SERVER_START_TIMEOUT_MS,
            config: OPENCODE_CONFIG,
        });
        server = created.server;
        const { client } = created;
        log(`OpenCode server: ${server.url}`);

        const session = unwrap(
            'session.create',
            await client.session.create({ body: { title: 'LLM Exploratory Tester' } }),
        );
        log(`OpenCode session: ${session.id}`);

        const promptSession = async (text: string): Promise<void> => {
            // promptAsync answers 204 No Content, so only its error is checkable.
            const { error } = await client.session.promptAsync({
                path: { id: session.id },
                body: {
                    model: MODEL,
                    // @ts-expect-error OpenCode 1.18 accepts variant; the v1 SDK types omit it.
                    variant: REASONING_EFFORT,
                    parts: [{ type: 'text', text }],
                    format: { type: 'json_schema', schema: TestResultJsonSchema },
                },
            });
            if (error !== undefined) {
                throw new Error(`session.promptAsync: ${JSON.stringify(error)}`);
            }
        };

        const messages = new Map<string, Message>();
        const totalCostUsd = () =>
            [...messages.values()].reduce(
                (sum, m) => sum + (m.role === 'assistant' ? m.cost : 0),
                0,
            );

        // Returning from watchRun's for-await at session.idle finalizes the SSE
        // generator and kills the connection, so every round subscribes afresh
        // — before prompting, so no event of the round is missed.
        const runOnce = async (text: string): Promise<TestResult> => {
            const from = messages.size;
            const roundEvents = await client.event.subscribe();
            await promptSession(text);
            await watchRun({
                client,
                sessionId: session.id,
                events: roundEvents.stream,
                maxBudgetUsd,
                timeoutMs,
                signal: abort.signal,
                messages,
            });

            return parseStructuredOutput([...messages.values()].slice(from));
        };

        let result = await runOnce(prompt);

        // A zero total means OpenRouter pricing for the model was not
        // resolved — the budget cap would never trip, so fail loudly.
        if (totalCostUsd() === 0) {
            throw new Error('OpenCode reported zero cost; the budget cap cannot be enforced');
        }

        // The agent tends to stop early on long checklists; resume the session
        // until it accounts for every area or the continuation budget is out.
        for (let n = 0; result.unfinished.length > 0 && n < MAX_CONTINUATIONS; n++) {
            log(
                `Agent unfinished (${result.unfinished.join('; ')}) — resuming (${n + 1}/${MAX_CONTINUATIONS})`,
            );
            result = await runOnce(
                [
                    `You reported unfinished coverage: ${result.unfinished.join('; ')}.`,
                    'Continue what remains actionable. Items blocked by the sandbox itself',
                    '(fault injection, navigation rules) stay blocked — keep them in',
                    '`unfinished` and do not re-attempt them. End with the structured',
                    'output again.',
                ].join(' '),
            );
        }

        log(`Agent cost: $${totalCostUsd().toFixed(4)}`);

        return result;
    } finally {
        clearTimeout(killTimer);
        abort.abort();
        server?.close();
    }
}
