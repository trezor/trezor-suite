import { type Event, type Message, type OpencodeClient } from '@opencode-ai/sdk/v2';
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

type Run = {
    client: OpencodeClient;
    sessionId: string;
    // Shared across continuations so the budget cap sees the cumulative cost.
    messages: Map<string, Message>;
    maxBudgetUsd: number;
    timeoutMs: number;
    // Abort means the kill timer fired — used only to word the final error.
    signal: AbortSignal;
};

function totalCostUsd(messages: Map<string, Message>): number {
    return [...messages.values()].reduce(
        (sum, m) => sum + (m.role === 'assistant' ? m.cost : 0),
        0,
    );
}

function handleEvent(client: OpencodeClient, event: Event): void {
    // Config denies every permission outright, so a request should never
    // arrive — reject any that does, since an unanswered one hangs the run.
    if (event.type === 'permission.asked') {
        void client.permission.reply({ requestID: event.properties.id, reply: 'reject' });
        log(
            `[permission] REJECTED ${event.properties.permission}: ${event.properties.patterns.join(', ')}`,
        );
        log(`[permission] rejected detail: ${JSON.stringify(event.properties)}`);

        return;
    }

    if (event.type === 'session.error') {
        log(`[session.error] ${JSON.stringify(event.properties)}`);

        return;
    }

    if (event.type === 'message.part.delta' && event.properties.field === 'text') {
        process.stderr.write(event.properties.delta);

        return;
    }

    if (event.type === 'message.part.updated' && event.properties.part.type === 'tool') {
        const { part } = event.properties;
        const detail = part.state.status === 'error' ? ` ${part.state.error}` : '';
        log(`[tool] ${part.tool} ${part.state.status}${detail}`);
    }
}

// The json_schema format makes the server attach the validated verdict to the
// final assistant message as `structured`. No message with `structured` at
// all means the run broke — say so.
function parseStructuredOutput(messages: Message[]): TestResult {
    for (const info of messages.toReversed()) {
        if (info.role !== 'assistant') continue;

        const { structured } = info;
        if (structured === undefined) continue;

        const parsed = TestResultSchema.safeParse(structured);
        if (!parsed.success) {
            throw new Error(`structured output failed TestResultSchema: ${parsed.error.message}`);
        }

        return parsed.data;
    }

    throw new Error('OpenCode ended without structured output');
}

function isolateServerConfig(): void {
    // The SDK spawns the server without a cwd option, and the MCP output dir
    // in OPENCODE_CONFIG is repo-relative.
    process.chdir(REPO_ROOT);
    // Isolate the server from the developer's global OpenCode config — it
    // inherits our env, and a global opencode.json would silently widen the
    // sandbox with extra MCP servers, plugins, or instructions.
    mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
    process.env.XDG_CONFIG_HOME = OPENCODE_CONFIG_DIR;
}

async function sendPrompt(run: Run, text: string): Promise<void> {
    await run.client.session.promptAsync(
        {
            sessionID: run.sessionId,
            model: MODEL,
            variant: REASONING_EFFORT,
            parts: [{ type: 'text', text }],
            // retryCount: the server re-asks the model when its structured
            // output fails schema validation, instead of failing the run.
            format: { type: 'json_schema', schema: TestResultJsonSchema, retryCount: 2 },
        },
        { throwOnError: true },
    );
}

// session.prompt holds one HTTP request open for the whole run and Node drops
// it after a while, so fire promptAsync and watch the event stream until the
// session goes idle. message.updated carries everything we need — per-step
// cost for the budget cap and the structured verdict — and session.messages
// is avoided on purpose: OpenCode 1.18 fails to re-validate the stored
// OutputFormat on read and answers 400.
async function waitForIdle(run: Run, events: AsyncIterable<Event>): Promise<void> {
    for await (const event of events) {
        handleEvent(run.client, event);
        if (event.type === 'message.updated') {
            const { info } = event.properties;
            if (info.sessionID !== run.sessionId) continue;
            run.messages.set(info.id, info);

            const totalCost = totalCostUsd(run.messages);
            if (totalCost > run.maxBudgetUsd) {
                await run.client.session.abort({ sessionID: run.sessionId });
                throw new Error(
                    `Agent budget exceeded: $${totalCost.toFixed(2)} > $${run.maxBudgetUsd}`,
                );
            }
        }
        if (event.type === 'session.idle' && event.properties.sessionID === run.sessionId) {
            return;
        }
    }

    if (run.signal.aborted) {
        throw new Error(`OpenCode timed out after ${run.timeoutMs / 60_000} min`);
    }

    throw new Error('OpenCode event stream ended before session.idle');
}

// Returning from waitForIdle's for-await at session.idle finalizes the SSE
// generator and kills the connection, so every round subscribes afresh
// — before prompting, so no event of the round is missed.
async function runRound(run: Run, text: string): Promise<TestResult> {
    const from = run.messages.size;
    const roundEvents = await run.client.event.subscribe();
    await sendPrompt(run, text);
    await waitForIdle(run, roundEvents.stream);

    return parseStructuredOutput([...run.messages.values()].slice(from));
}

function continuationPrompt(unfinished: string[]): string {
    return [
        `You reported unfinished coverage: ${unfinished.join('; ')}.`,
        'Continue what remains actionable. Items blocked by the sandbox itself',
        '(fault injection, navigation rules) stay blocked — keep them in',
        '`unfinished` and do not re-attempt them. End with the structured',
        'output again.',
    ].join(' ');
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
    isolateServerConfig();

    // ESM-only package; this file is loaded as CJS by tsx.
    const { createOpencode } = await import('@opencode-ai/sdk/v2');

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

        const { data: session } = await client.session.create(
            { title: 'LLM Exploratory Tester' },
            { throwOnError: true },
        );
        log(`OpenCode session: ${session.id}`);

        const run: Run = {
            client,
            sessionId: session.id,
            messages: new Map(),
            maxBudgetUsd,
            timeoutMs,
            signal: abort.signal,
        };

        let result = await runRound(run, prompt);

        // A zero total means OpenRouter pricing for the model was not
        // resolved — the budget cap would never trip, so fail loudly.
        if (totalCostUsd(run.messages) === 0) {
            throw new Error('OpenCode reported zero cost; the budget cap cannot be enforced');
        }

        // The agent tends to stop early on long checklists; resume the session
        // until it accounts for every area or the continuation budget is out.
        for (let n = 0; result.unfinished.length > 0 && n < MAX_CONTINUATIONS; n++) {
            log(
                `Agent unfinished (${result.unfinished.join('; ')}) — resuming (${n + 1}/${MAX_CONTINUATIONS})`,
            );
            result = await runRound(run, continuationPrompt(result.unfinished));
        }

        log(`Agent cost: $${totalCostUsd(run.messages).toFixed(4)}`);

        return result;
    } finally {
        clearTimeout(killTimer);
        abort.abort();
        server?.close();
    }
}
