import { spawnSync } from 'node:child_process';
import { closeSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { log, warn } from '../logger';
import { reportTokenUsage } from '../tokenUsage';
import { type ClaudeResult, ClaudeResultSchema } from './schemas';

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
}): ClaudeRunResult {
    const { root, args, input, tmpPrefix } = opts;

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
    });

    closeSync(stdoutFd);
    const output = readFileSync(tmpFile, 'utf-8');
    unlinkSync(tmpFile);

    return { output, status: result.status, signal: result.signal, spawnError: result.error };
}

function parseClaudeOutput(raw: string): ClaudeResult {
    const unsafeParsed: unknown = JSON.parse(raw.trim());
    const entries = Array.isArray(unsafeParsed) ? unsafeParsed : [unsafeParsed];
    const resultEntry = entries
        .map(entry => ClaudeResultSchema.safeParse(entry))
        .find(parsed => parsed.success && parsed.data.type === 'result');

    if (!resultEntry?.success) {
        throw new Error('No result entry found in Claude output');
    }

    return resultEntry.data;
}

export function processAgentOutput(
    rawOutput: string,
    agent: 'nightlyAnalyzer' | 'nightlyFixer',
    model: string,
): ClaudeResult | null {
    let result: ClaudeResult;
    try {
        result = parseClaudeOutput(rawOutput);
    } catch {
        warn(`[${agent}] agent output unparsable (${rawOutput.length} bytes)`);

        return null;
    }

    const subtype = result.subtype ?? '?';
    const text = result.result ?? '';
    const preview = text.length > 800 ? `${text.slice(0, 800)}…` : text;

    log(`[${agent}] subtype=${subtype}`);
    if (preview) log(preview);

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

    return result;
}
