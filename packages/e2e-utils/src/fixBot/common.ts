import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, openSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { log, warn } from '../logger';
import { reportTokenUsage } from '../tokenUsage';
import {
    type ClaudeResult,
    ClaudeResultSchema,
    type Ledger,
    LedgerSchema,
    type SlackFixSummary,
    SlackFixSummarySchema,
} from './schemas';
import { type AgentName, formatStageBreakdown } from './stageCost';

export const EMPTY_LEDGER: Ledger = { version: 1, updatedAt: '1970-01-01', entries: [] };

export function loadLedger(path: string): Ledger {
    if (!existsSync(path)) return EMPTY_LEDGER;

    try {
        const parsed = LedgerSchema.safeParse(JSON.parse(readFileSync(path, 'utf-8')));
        if (parsed.success) {
            return parsed.data;
        }
        warn(`[ledger] ${path} failed schema validation — starting from empty ledger.`);
    } catch (e) {
        warn(`[ledger] could not read ${path} (${(e as Error).message}) — starting from empty.`);
    }

    return EMPTY_LEDGER;
}

export function readSummaries(summariesDir: string | undefined): SlackFixSummary[] {
    if (!summariesDir || !existsSync(summariesDir)) return [];

    const parsedSummaries: SlackFixSummary[] = [];
    const allSummariesFiles = readdirSync(summariesDir).filter(
        n => n.startsWith('slack-fix-summary-') && n.endsWith('.json'),
    );
    for (const filename of allSummariesFiles) {
        const parsed = SlackFixSummarySchema.safeParse(
            JSON.parse(readFileSync(join(summariesDir, filename), 'utf-8')),
        );

        if (!parsed.success) {
            warn(`[summaries] Failed to parse ${filename}: ${parsed.error.message}`);
            continue;
        }

        parsedSummaries.push(parsed.data);
    }

    return parsedSummaries;
}

export interface ClaudeRunResult {
    output: string;
    status: number | null;
    signal: NodeJS.Signals | null;
    spawnError: Error | undefined;
}

export function runClaude(opts: {
    root: string;
    args: string[];
    input: string;
    tmpPrefix: string;
    timeoutMs?: number;
}): ClaudeRunResult {
    const { root, args, input, tmpPrefix, timeoutMs } = opts;

    const env = { ...process.env };
    // Prevents an internal Claude Code setting from accidentally being inherited
    delete env['MCP_CONNECTION_NONBLOCKING'];

    const tmpFile = join(tmpdir(), `${tmpPrefix}-${Date.now()}.json`);
    const stdoutFd = openSync(tmpFile, 'w');

    const result = spawnSync(join(root, 'node_modules/.bin/claude'), args, {
        input,
        cwd: root,
        env,
        stdio: ['pipe', stdoutFd, 'inherit'],
        timeout: timeoutMs,
        killSignal: 'SIGTERM',
    });

    closeSync(stdoutFd);
    const output = readFileSync(tmpFile, 'utf-8');
    unlinkSync(tmpFile);

    return { output, status: result.status, signal: result.signal, spawnError: result.error };
}

function parseEnvelopeEntries(rawOutput: string): unknown[] | null {
    try {
        const parsed: unknown = JSON.parse(rawOutput.trim());

        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return null;
    }
}

function findResultEntry(entries: unknown[]): ClaudeResult | null {
    const resultEntry = entries
        .map(entry => ClaudeResultSchema.safeParse(entry))
        .find(parsed => parsed.success && parsed.data.type === 'result');

    return resultEntry?.success ? resultEntry.data : null;
}

function logResultToTerminal(agentName: AgentName, claudeResult: ClaudeResult): void {
    const RESULT_PREVIEW_LIMIT = 800;
    log(`[${agentName}] subtype=${claudeResult.subtype ?? 'N/A'}`);

    if (claudeResult.result) {
        log(`${claudeResult.result.slice(0, RESULT_PREVIEW_LIMIT)}`);
    }
}

export function processAgentOutput(
    rawOutput: string,
    agent: AgentName,
    model: string,
): ClaudeResult | null {
    const entries = parseEnvelopeEntries(rawOutput);
    if (!entries) {
        warn(`[${agent}] agent output unparsable (${rawOutput.length} bytes)`);

        return null;
    }

    const result = findResultEntry(entries);
    if (!result) {
        warn(`[${agent}] no result entry found in agent output`);

        return null;
    }

    logResultToTerminal(agent, result);

    reportTokenUsage({
        timestamp: new Date().toISOString(),
        run_id: process.env.GITHUB_RUN_ID ?? 'local',
        script: agent,
        model,
        source: 'cli',
        workflow: process.env.GITHUB_WORKFLOW ?? null,
        pr_number: null,
        input_tokens: result.usage?.input_tokens ?? null,
        output_tokens: result.usage?.output_tokens ?? null,
        total_cost_usd: result.total_cost_usd,
    });

    const breakdown = formatStageBreakdown(agent, entries, result);
    log(breakdown ?? `[${agent}] no stage breakdown available`);

    return result;
}
