import { formatMessage } from 'claude-pretty-printer';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';

import { log } from '../logger';
import { REPO_ROOT } from './paths';
import { type ClaudeResult, ClaudeResultSchema } from './schemas';

const MAX_LOG_CHARS = 1000;

export type ClaudeRunResult = {
    output: string;
    status: number | null;
};

type RunClaudeOptions = {
    args: string[];
    input: string;
    timeoutMs: number;
};

export function processAgentOutput(rawOutput: string): ClaudeResult {
    for (const line of rawOutput.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        const parsed = ClaudeResultSchema.safeParse(JSON.parse(trimmed));
        if (parsed.success && parsed.data.type === 'result') {
            return parsed.data;
        }
    }

    throw new Error('no result entry in claude stdout');
}

export async function runClaude({
    args,
    input,
    timeoutMs,
}: RunClaudeOptions): Promise<ClaudeRunResult> {
    const env = { ...process.env };
    // Prevents an internal Claude Code setting from accidentally being inherited.
    delete env.MCP_CONNECTION_NONBLOCKING;

    const child = spawn(`${REPO_ROOT}/node_modules/.bin/claude`, args, {
        cwd: REPO_ROOT,
        env,
        stdio: ['pipe', 'pipe', 'inherit'],
    });

    child.stdin.end(input);

    let output = '';
    createInterface({ input: child.stdout }).on('line', line => {
        output += `${line}\n`;
        try {
            const formatted = formatMessage(JSON.parse(line), false);
            log(
                formatted.length > MAX_LOG_CHARS
                    ? `${formatted.slice(0, MAX_LOG_CHARS)}…`
                    : formatted,
            );
        } catch {
            log(line);
        }
    });

    const killTimer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);

    try {
        const [status] = await Promise.race([
            once(child, 'close'),
            once(child, 'error').then(([e]) => {
                throw e;
            }),
        ]);

        if (child.killed) {
            throw new Error('Claude process killed probably because it timed out');
        }

        return { output, status };
    } finally {
        clearTimeout(killTimer);
    }
}
