import {
    AbortError,
    type Options,
    type SDKMessage,
    type SDKResultMessage,
    query,
} from '@anthropic-ai/claude-agent-sdk';
import { formatMessage } from 'claude-pretty-printer';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { log, warn } from '../logger';
import { reportToSlack } from './errors';
import {
    type AgentName,
    type Ledger,
    LedgerSchema,
    type SlackFixSummary,
    SlackFixSummarySchema,
} from './schemas';

export const EMPTY_LEDGER: Ledger = { version: 1, updatedAt: '1970-01-01', entries: [] };

export function loadLedger(path: string): Ledger {
    if (!existsSync(path)) {
        reportToSlack(
            `[ledger] not found at ${path} — the S3 download failed or no ledger exists yet.`,
        );

        return EMPTY_LEDGER;
    }

    try {
        const parsed = LedgerSchema.safeParse(JSON.parse(readFileSync(path, 'utf-8')));
        if (parsed.success) {
            return parsed.data;
        }
        warn(`[ledger] ${path} failed schema validation — starting from empty ledger.`);
    } catch (e) {
        warn(`[ledger] could not read ${path} (${(e as Error).message}) — starting from empty.`);
    }

    reportToSlack('[ledger] could not be loaded — this run analyzed with an empty ledger.');

    return EMPTY_LEDGER;
}

export interface ReadSummariesResult {
    summaries: SlackFixSummary[];
    problemsByTaskId: Record<string, string>;
}

export function readSummaries(summariesDir: string | undefined): ReadSummariesResult {
    const result: ReadSummariesResult = { summaries: [], problemsByTaskId: {} };

    if (!summariesDir || !existsSync(summariesDir)) return result;

    const allSummariesFiles = readdirSync(summariesDir).filter(
        n => n.startsWith('slack-fix-summary-') && n.endsWith('.json'),
    );
    for (const filename of allSummariesFiles) {
        const parsed = SlackFixSummarySchema.safeParse(
            JSON.parse(readFileSync(join(summariesDir, filename), 'utf-8')),
        );

        if (!parsed.success) {
            warn(`[summaries] Failed to parse ${filename}: ${parsed.error.message}`);
            const taskId = filename.slice('slack-fix-summary-'.length, -'.json'.length);
            result.problemsByTaskId[taskId] =
                'Its result file could not be read, so this task shows as not completed.';
            continue;
        }

        result.summaries.push(parsed.data);
    }

    return result;
}

/** Prefers subprocess stderr, which usually holds the real cause, over the wrapper message. */
export function getErrorText(err: unknown): string {
    const stderr = (err as { stderr?: unknown })?.stderr;
    let detail = '';
    if (typeof stderr === 'string') {
        detail = stderr.trim();
    } else if (Buffer.isBuffer(stderr)) {
        detail = stderr.toString('utf-8').trim();
    }

    if (detail) return detail;

    return err instanceof Error ? err.message : String(err);
}

export interface AgentRunResult {
    result: SDKResultMessage | null;
    timedOut: boolean;
    error: string | undefined;
}

export interface RunAgentOptions {
    root: string;
    agent: AgentName;
    prompt: string;
    model: string;
    outputSchema: Record<string, unknown>;
    maxBudgetUsd: number;
    timeoutMs: number;
    mcpServers?: Options['mcpServers'];
    allowedTools?: string[];
}

const MAX_LOGGED_ERROR_CHARS = 400;

// Keeps only truncated error content for tool_result blocks
function summarizeToolResults(message: SDKMessage): SDKMessage {
    if (message.type !== 'user' || typeof message.message.content === 'string') {
        return message;
    }

    const toolContent = message.message.content.map(block => {
        if (block.type !== 'tool_result') {
            return block;
        }

        const body =
            typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? []);

        if (!block.is_error) {
            return { ...block, content: `[${body.length} chars]` };
        }

        const truncated = body.length > MAX_LOGGED_ERROR_CHARS;

        return {
            ...block,
            content: truncated ? `${body.slice(0, MAX_LOGGED_ERROR_CHARS)}…` : body,
        };
    });

    return { ...message, message: { ...message.message, content: toolContent } };
}

function logAgentMessage(message: SDKMessage) {
    try {
        log(formatMessage(summarizeToolResults(message), false));
    } catch {
        log(`[${message.type} message could not be rendered]`);
    }
}

function writeCostFile(totalCostUsd: number | undefined): void {
    if (totalCostUsd === undefined || !process.env.GITHUB_ACTIONS) return;

    try {
        writeFileSync(
            '/tmp/llm-token-usage.json',
            JSON.stringify({ total_cost_usd: totalCostUsd }),
        );
    } catch (e) {
        warn(`[cost] could not write the cost file: ${(e as Error).message}`);
        reportToSlack('Agent cost could not be recorded — the cost shown here is incomplete.');
    }
}

/**
 * Runs one agent to completion, logging each message as it arrives and reporting
 * final cost as it finishes.
 */
export async function runAgent({
    root,
    agent,
    prompt,
    model,
    outputSchema,
    maxBudgetUsd,
    timeoutMs,
    mcpServers,
    allowedTools,
}: RunAgentOptions): Promise<AgentRunResult> {
    const env = { ...process.env };
    // Prevents an internal Claude Code setting from accidentally being inherited
    delete env['MCP_CONNECTION_NONBLOCKING'];

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    let result: SDKResultMessage | null = null;
    let error: string | undefined;

    try {
        for await (const message of query({
            prompt,
            options: {
                cwd: root,
                env,
                abortController,
                model,
                permissionMode: 'auto',
                maxBudgetUsd,
                outputFormat: { type: 'json_schema', schema: outputSchema },
                pathToClaudeCodeExecutable: join(root, 'node_modules/.bin/claude'),
                strictMcpConfig: true,
                mcpServers,
                allowedTools,
            },
        })) {
            logAgentMessage(message);

            if (message.type === 'result') result = message;
        }
    } catch (e) {
        // An abort surfaces as a thrown AbortError rather than a result message.
        if (!(e instanceof AbortError)) error = getErrorText(e);
    } finally {
        clearTimeout(timeout);
    }

    const totalCostUsd = result?.total_cost_usd;
    log(
        `[${agent}] total cost: ${totalCostUsd !== undefined ? `$${totalCostUsd.toFixed(4)}` : 'n/a'}`,
    );
    writeCostFile(totalCostUsd);

    return { result, timedOut: abortController.signal.aborted, error };
}
