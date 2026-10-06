import {
    type AssistantMessage,
    type Event,
    type Message,
    type OpencodeClient,
    type OutputFormat,
    type Part,
    type PermissionRequest,
} from '@opencode-ai/sdk/v2';
import { mkdirSync } from 'node:fs';

import { log } from '../logger';
import { MODEL, OPENCODE_CONFIG, REASONING_EFFORT } from './opencodeConfig';
import { OPENCODE_CONFIG_DIR, REPO_ROOT } from './paths';
import { type TestResult, TestResultJsonSchema, TestResultSchema } from './schemas';

const SERVER_START_TIMEOUT_MS = 30_000;
const MAX_CONSECUTIVE_UNPRICED_STEPS = 3;

const VERDICT_FORMAT: OutputFormat = {
    type: 'json_schema',
    schema: TestResultJsonSchema,
    retryCount: 2,
};

const VERDICT_PROMPT =
    'Testing is over. Do not call tools. Emit the structured verdict for the WHOLE run: ' +
    'result, summary, unfinished, issues — every pass and every issue found so far.';

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

type Session = {
    client: OpencodeClient;
    sessionId: string;
    budgetGuard: BudgetGuard;
};

type Turn = {
    prompt: string;
    format?: OutputFormat;
};

function isolateServerConfig(): void {
    // The SDK spawn has no cwd option; MCP output dirs are repo-relative.
    process.chdir(REPO_ROOT);
    mkdirSync(OPENCODE_CONFIG_DIR, { recursive: true });
    process.env.XDG_CONFIG_HOME = OPENCODE_CONFIG_DIR;
    // Otherwise opencode injects the repo AGENTS.md and ~/.claude files into the system prompt.
    process.env.OPENCODE_DISABLE_PROJECT_CONFIG = '1';
    process.env.OPENCODE_DISABLE_CLAUDE_CODE = '1';
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

function isAssistant(message: Message): message is AssistantMessage {
    return message.role === 'assistant';
}

// The budget cap is only as good as the per-step cost; a completed step billed
// at $0 means the model omitted usage. Errored steps legitimately cost nothing.
function isUnpricedStep(message: Message): boolean {
    return (
        isAssistant(message) &&
        message.time.completed !== undefined &&
        message.error === undefined &&
        message.cost === 0
    );
}

class BudgetGuard {
    private readonly costByMessage = new Map<string, number>();
    private readonly unpricedSteps = new Set<string>();

    constructor(private readonly maxBudgetUsd: number) {}

    get spentUsd(): number {
        return [...this.costByMessage.values()].reduce((sum, cost) => sum + cost, 0);
    }

    get stopReason(): string | undefined {
        if (this.spentUsd > this.maxBudgetUsd) {
            return `Agent budget exceeded: $${this.spentUsd.toFixed(2)} > $${this.maxBudgetUsd}`;
        }
        if (this.unpricedSteps.size >= MAX_CONSECUTIVE_UNPRICED_STEPS) {
            return `Agent reported $0 for ${this.unpricedSteps.size} consecutive steps; budget cannot be enforced`;
        }

        return undefined;
    }

    recordCost(message: Message): void {
        if (!isAssistant(message)) return;

        this.costByMessage.set(message.id, message.cost);
        if (isUnpricedStep(message)) this.unpricedSteps.add(message.id);
        else if (message.cost > 0) this.unpricedSteps.clear();
    }
}

// session.prompt keeps one HTTP request open for the whole run and Node
// drops it, so promptAsync + events until idle. Do not call session.messages:
// OpenCode 1.18 fails to re-validate the stored OutputFormat and answers 400.
async function watchUntilIdle(
    { client, sessionId, budgetGuard }: Session,
    events: AsyncIterable<Event>,
): Promise<Message[]> {
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

                budgetGuard.recordCost(info);
                if (budgetGuard.stopReason) {
                    await client.session.abort({ sessionID: sessionId });
                    throw new Error(budgetGuard.stopReason);
                }
                break;
            }
            case 'session.idle':
                return [...messages.values()];
            default:
                break;
        }
    }

    throw new Error('OpenCode event stream ended before session.idle');
}

async function subscribeToEvents(session: Session) {
    const { client } = session;
    const { stream } = await client.event.subscribe();
    const first = await stream.next();

    if (first.done || first.value.type !== 'server.connected') {
        throw new Error('OpenCode event stream did not open with server.connected');
    }

    return stream;
}

// Leaving watchUntilIdle at session.idle closes the SSE stream, so each turn
// must subscribe before prompting.
async function runTurn(session: Session, { prompt, format }: Turn): Promise<Message[]> {
    const { client, sessionId } = session;
    const stream = await subscribeToEvents(session);
    await client.session.promptAsync(
        {
            sessionID: sessionId,
            model: MODEL,
            variant: REASONING_EFFORT,
            parts: [{ type: 'text', text: prompt }],
            format,
        },
        { throwOnError: true },
    );

    return watchUntilIdle(session, stream);
}

// A schema retry can append an assistant message that has no structured payload.
// The verdict is the latest assistant message that does.
function parseVerdict(messages: Message[]): TestResult {
    for (const message of messages.toReversed()) {
        if (!isAssistant(message) || message.structured === undefined) {
            continue;
        }

        return TestResultSchema.parse(message.structured);
    }

    throw new Error('OpenCode verdict turn ended without structured output');
}

// The testing turn carries no output format: models like GLM stop after a tool
// call without a schema payload, which would end the run with nothing to parse.
// The verdict is a separate, tool-free turn; OpenCode's own retryCount handles
// schema misses there.
async function requestVerdict(session: Session): Promise<TestResult> {
    const messages = await runTurn(session, { prompt: VERDICT_PROMPT, format: VERDICT_FORMAT });

    return parseVerdict(messages);
}

export async function runOpencode({
    prompt,
    timeoutMs,
    maxBudgetUsd,
}: RunOpencodeOptions): Promise<TestResult> {
    const { client, signal, stopServer } = await startServer(timeoutMs);
    try {
        const budgetGuard = new BudgetGuard(maxBudgetUsd);
        const session: Session = {
            client,
            sessionId: await createSession(client),
            budgetGuard,
        };
        await runTurn(session, { prompt });
        const verdict = await requestVerdict(session);

        // Estimated from provider-reported usage; the OpenRouter key runs across
        // PRs so the key-level usage is not attributable to this run.
        log(`Agent cost: $${budgetGuard.spentUsd.toFixed(4)} (OpenCode estimate)`);

        return verdict;
    } catch (e) {
        if (signal.aborted) {
            throw new Error(`OpenCode timed out after ${timeoutMs / 60_000} min`, { cause: e });
        }
        throw e;
    } finally {
        stopServer();
    }
}
