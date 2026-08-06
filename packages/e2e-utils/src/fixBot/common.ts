import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { log, warn } from '../logger';
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

export interface AgentRunResult {
    transcript: string;
    exitCode: number | null;
    timedOut: boolean;
    spawnError: Error | undefined;
}

export interface RunAgentOptions {
    root: string;
    args: string[];
    prompt: string;
    tmpPrefix: string;
    timeoutMs: number;
}

// `--output-format stream-json` emits one JSON envelope per line as the agent
// works, where `json` buffers a single array until the run ends and so shows
// nothing while it runs. `jq` renders those lines for the terminal (and the CI
// log) as they arrive; `tee` keeps them for the result envelope and the cost
// breakdown. pipefail makes `timeout`'s exit code the pipeline's own.
const AGENT_PIPELINE = `
set -o pipefail
timeout "$AGENT_TIMEOUT_S" "$AGENT_CLAUDE_BIN" "$@" \\
  | tee "$AGENT_TRANSCRIPT" \\
  | jq -r -f "$AGENT_LOG_FILTER"
`;

const TIMEOUT_EXIT_CODE = 124;

export function runAgent({
    root,
    args,
    prompt,
    tmpPrefix,
    timeoutMs,
}: RunAgentOptions): AgentRunResult {
    const env = { ...process.env };
    // Prevents an internal Claude Code setting from accidentally being inherited
    delete env['MCP_CONNECTION_NONBLOCKING'];

    const transcriptPath = join(tmpdir(), `${tmpPrefix}-${Date.now()}.ndjson`);

    const result = spawnSync('bash', ['-c', AGENT_PIPELINE, 'agent-pipeline', ...args], {
        input: prompt,
        cwd: root,
        env: {
            ...env,
            AGENT_CLAUDE_BIN: join(root, 'node_modules/.bin/claude'),
            AGENT_TRANSCRIPT: transcriptPath,
            AGENT_LOG_FILTER: join(__dirname, 'streamFormat.jq'),
            AGENT_TIMEOUT_S: String(Math.ceil(timeoutMs / 1000)),
        },
        stdio: ['pipe', 'inherit', 'inherit'],
    });

    const transcript = readFileSync(transcriptPath, 'utf-8');
    unlinkSync(transcriptPath);

    return {
        transcript,
        exitCode: result.status,
        timedOut: result.status === TIMEOUT_EXIT_CODE,
        spawnError: result.error,
    };
}

const parseEnvelopes = (transcript: string): unknown[] =>
    transcript
        .trim()
        .split('\n')
        .map(line => JSON.parse(line) as unknown);

function findResultEntry(entries: unknown[]): ClaudeResult | null {
    const resultEntry = entries
        .map(entry => ClaudeResultSchema.safeParse(entry))
        .find(parsed => parsed.success && parsed.data.type === 'result');

    return resultEntry?.success ? resultEntry.data : null;
}

function writeCostFile(totalCostUsd: number | undefined): void {
    if (totalCostUsd === undefined || !process.env.GITHUB_ACTIONS) return;

    try {
        writeFileSync(
            '/tmp/llm-token-usage.json',
            JSON.stringify({ total_cost_usd: totalCostUsd }),
        );
    } catch {
        // non-critical
    }
}

export function processAgentOutput(transcript: string, agent: AgentName): ClaudeResult | null {
    const entries = parseEnvelopes(transcript);
    const result = findResultEntry(entries);

    if (!result) {
        warn(`[${agent}] no result entry found in agent output`);

        return null;
    }

    writeCostFile(result.total_cost_usd);

    const breakdown = formatStageBreakdown(agent, entries, result);
    log(breakdown ?? `[${agent}] no stage breakdown available`);

    return result;
}
