import {
    type Event,
    type Message,
    type OpencodeClient,
    type Part,
    type PermissionRequest,
} from '@opencode-ai/sdk/v2';
import { mkdirSync } from 'node:fs';

import { log } from '../logger';
import { MODEL, OPENCODE_CONFIG, REASONING_EFFORT } from './opencodeConfig';
import { OPENCODE_CONFIG_DIR, REPO_ROOT } from './paths';
import { type TestResult, TestResultJsonSchema, TestResultSchema } from './schemas';

const SERVER_START_TIMEOUT_MS = 30_000;
const MAX_CONTINUATIONS = 3;

type RunOpencodeOptions = {
    prompt: string;
    timeoutMs: number;
    maxBudgetUsd: number;
};

type Server = {
    client: OpencodeClient;
    signal: AbortSignal;
    stopServer: () => void;
};

type Budget = {
    spentUsd: number;
    maxBudgetUsd: number;
};

type RoundOutcome = {
    verdict: TestResult;
    costUsd: number;
};

function isolateServerConfig(): void {
    // The SDK spawn has no cwd option; MCP output dirs are repo-relative.
    process.chdir(REPO_ROOT);
    mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
    process.env.XDG_CONFIG_HOME = OPENCODE_CONFIG_DIR;
}

async function startServer(timeoutMs: number): Promise<Server> {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is required');
    }
    isolateServerConfig();

    // ESM-only package; this file is loaded as CJS by tsx.
    const { createOpencode } = await import('@opencode-ai/sdk/v2');

    const abort = new AbortController();
    const killTimer = setTimeout(() => abort.abort(), timeoutMs);
    let server: { url: string; close(): void } | undefined;
    const stopServer = () => {
        clearTimeout(killTimer);
        abort.abort();
        server?.close();
    };

    try {
        const created = await createOpencode({
            port: 0,
            signal: abort.signal,
            timeout: SERVER_START_TIMEOUT_MS,
            config: OPENCODE_CONFIG,
        });
        server = created.server;
        log(`OpenCode server: ${server.url}`);

        return { client: created.client, signal: abort.signal, stopServer };
    } catch (e) {
        stopServer();
        throw e;
    }
}

async function createSession(client: OpencodeClient): Promise<string> {
    const { data: session } = await client.session.create(
        { title: 'LLM Exploratory Tester' },
        { throwOnError: true },
    );
    log(`OpenCode session: ${session.id}`);

    return session.id;
}

type SendPromptParams = {
    client: OpencodeClient;
    sessionId: string;
    prompt: string;
};

async function sendPrompt({ client, sessionId, prompt }: SendPromptParams): Promise<void> {
    await client.session.promptAsync(
        {
            sessionID: sessionId,
            model: MODEL,
            variant: REASONING_EFFORT,
            parts: [{ type: 'text', text: prompt }],
            format: { type: 'json_schema', schema: TestResultJsonSchema, retryCount: 2 },
        },
        { throwOnError: true },
    );
}

// Unanswered permission prompts hang the run.
function rejectPermission(client: OpencodeClient, request: PermissionRequest): void {
    void client.permission.reply({ requestID: request.id, reply: 'reject' });
    log(`[permission] REJECTED ${request.permission}: ${request.patterns.join(', ')}`);
    log(`[permission] rejected detail: ${JSON.stringify(request)}`);
}

function logToolPart(part: Part): void {
    if (part.type !== 'tool') return;

    const detail = part.state.status === 'error' ? ` ${part.state.error}` : '';
    log(`[tool] ${part.tool} ${part.state.status}${detail}`);
}

function assistantCostUsd(messages: Iterable<Message>): number {
    return [...messages].reduce((sum, m) => sum + (m.role === 'assistant' ? m.cost : 0), 0);
}

async function openrouterUsageUsd(): Promise<number> {
    const res = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    });
    const json: { data?: { usage?: number } } = await res.json();
    if (typeof json.data?.usage !== 'number') throw new Error('OpenRouter /key missing usage');

    return json.data.usage;
}

function parseVerdict(messages: Message[]): TestResult {
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

    throw new Error('OpenCode round ended without structured output');
}

type WatchRoundParams = {
    client: OpencodeClient;
    sessionId: string;
    events: AsyncIterable<Event>;
    budget: Budget;
};

// session.prompt keeps one HTTP request open for the whole run and Node
// drops it, so promptAsync + events until idle. Do not call session.messages:
// OpenCode 1.18 fails to re-validate the stored OutputFormat and answers 400.
async function watchRound({
    client,
    sessionId,
    events,
    budget,
}: WatchRoundParams): Promise<RoundOutcome> {
    const messages = new Map<string, Message>();

    for await (const event of events) {
        if ('sessionID' in event.properties && event.properties.sessionID !== sessionId) continue;

        switch (event.type) {
            case 'permission.asked':
                rejectPermission(client, event.properties);
                break;
            case 'session.error':
                log(`[session.error] ${JSON.stringify(event.properties)}`);
                break;
            case 'message.part.delta':
                if (event.properties.field === 'text') {
                    process.stderr.write(event.properties.delta);
                }
                break;
            case 'message.part.updated':
                logToolPart(event.properties.part);
                break;
            case 'message.updated': {
                const { info } = event.properties;
                messages.set(info.id, info);

                if (
                    info.role === 'assistant' &&
                    info.time.completed !== undefined &&
                    info.error === undefined &&
                    info.cost === 0
                ) {
                    await client.session.abort({ sessionID: sessionId });
                    throw new Error(
                        'OpenCode reported zero cost; the budget cap cannot be enforced',
                    );
                }

                const totalCost = budget.spentUsd + assistantCostUsd(messages.values());
                if (totalCost > budget.maxBudgetUsd) {
                    await client.session.abort({ sessionID: sessionId });
                    throw new Error(
                        `Agent budget exceeded: $${totalCost.toFixed(2)} > $${budget.maxBudgetUsd}`,
                    );
                }
                break;
            }
            case 'session.idle':
                return {
                    verdict: parseVerdict([...messages.values()]),
                    costUsd: assistantCostUsd(messages.values()),
                };
            default:
                break;
        }
    }

    throw new Error('OpenCode event stream ended before session.idle');
}

type RunRoundParams = {
    client: OpencodeClient;
    sessionId: string;
    prompt: string;
    budget: Budget;
};

// Leaving watchRound at session.idle closes the SSE stream, so each round
// must subscribe before prompting.
async function runRound({
    client,
    sessionId,
    prompt,
    budget,
}: RunRoundParams): Promise<RoundOutcome> {
    const { stream } = await client.event.subscribe();
    await sendPrompt({ client, sessionId, prompt });

    return watchRound({ client, sessionId, events: stream, budget });
}

function continuationPrompt(unfinished: string[]): string {
    return [
        `You reported unfinished coverage: ${unfinished.join('; ')}.`,
        'Continue what remains actionable. Items blocked by the sandbox itself',
        '(fault injection, navigation rules) stay blocked — keep them in',
        '`unfinished` and do not re-attempt them. End with the structured output',
        'for the WHOLE run — summary covering every pass and all issues found',
        'so far, not just this one.',
    ].join(' ');
}

export async function runOpencode({
    prompt,
    timeoutMs,
    maxBudgetUsd,
}: RunOpencodeOptions): Promise<TestResult> {
    const { client, signal, stopServer } = await startServer(timeoutMs);
    try {
        const sessionId = await createSession(client);
        const usageBefore = await openrouterUsageUsd();

        let spentUsd = 0;
        let round = await runRound({
            client,
            sessionId,
            prompt,
            budget: { spentUsd, maxBudgetUsd },
        });
        spentUsd += round.costUsd;

        for (let n = 0; round.verdict.unfinished.length > 0 && n < MAX_CONTINUATIONS; n++) {
            const { unfinished } = round.verdict;
            log(
                `Agent unfinished (${unfinished.join('; ')}) — resuming (${n + 1}/${MAX_CONTINUATIONS})`,
            );
            round = await runRound({
                client,
                sessionId,
                prompt: continuationPrompt(unfinished),
                budget: { spentUsd, maxBudgetUsd },
            });
            spentUsd += round.costUsd;
        }

        log(
            `Agent cost: $${spentUsd.toFixed(4)} (OpenCode) · $${((await openrouterUsageUsd()) - usageBefore).toFixed(4)} (OpenRouter)`,
        );

        return round.verdict;
    } catch (e) {
        if (signal.aborted) {
            throw new Error(`OpenCode timed out after ${timeoutMs / 60_000} min`, { cause: e });
        }
        throw e;
    } finally {
        stopServer();
    }
}
