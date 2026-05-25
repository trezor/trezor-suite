// TODO: This will removed and replaced by packages/e2e-utils/src/tokenUsage.ts
// when implementation gets to GHA stage
import { appendFileSync } from 'node:fs';

import { type ClaudeResult, ClaudeResultSchema } from './schemas';

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

function formatIntegerWithCommas(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

function formatTimestamp(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}Z`;
}

export function logAgentResult(rawOutput: string, agentName: string): void {
    let entry: ClaudeResult = {};
    try {
        entry = parseClaudeOutput(rawOutput);
    } catch {
        process.stderr.write(
            `[${agentName}] agent output unparsable (${rawOutput.length} bytes)\n`,
        );

        return;
    }

    const subtype = entry.subtype ?? '?';
    const text = entry.result ?? '';
    const preview = text.length > 800 ? `${text.slice(0, 800)}…` : text;

    process.stderr.write(`[${agentName}] subtype=${subtype}\n`);
    if (preview) process.stderr.write(`${preview}\n`);
}

export function reportTokenUsage(rawOutput: string, logFilePath: string, agentName: string): void {
    let result: ClaudeResult = {};
    try {
        result = parseClaudeOutput(rawOutput);
    } catch {
        process.stderr.write(
            `[${agentName}] agent output unparsable (${rawOutput.length} bytes)\n`,
        );

        return;
    }

    const timestamp = formatTimestamp(new Date());
    const paddedAgentName = agentName.padEnd(20).slice(0, 20);

    const turnsField = result.num_turns != null ? String(result.num_turns).padStart(3) : 'N/A';

    const formatTokenCount = (tokenCount: number | undefined) =>
        tokenCount != null ? formatIntegerWithCommas(tokenCount).padStart(9) : 'N/A'.padStart(9);

    const inputTokens = formatTokenCount(result.usage?.input_tokens);
    const outputTokens = formatTokenCount(result.usage?.output_tokens);
    const cacheWriteTokens = formatTokenCount(result.usage?.cache_creation_input_tokens);
    const cacheReadTokens = formatTokenCount(result.usage?.cache_read_input_tokens);

    const COST_FIELD_WIDTH = 9; // '$' + 8-char number
    const costField =
        result.total_cost_usd != null
            ? `$${result.total_cost_usd.toFixed(4).padStart(8)}`
            : 'N/A'.padStart(COST_FIELD_WIDTH);

    const DURATION_FIELD_WIDTH = 6; // 5-char number + 's'
    const durationField =
        result.duration_ms != null
            ? `${String(Math.round(result.duration_ms / 1000)).padStart(5)}s`
            : 'N/A'.padStart(DURATION_FIELD_WIDTH);

    const line = `${timestamp}  ${paddedAgentName}  turns=${turnsField}  in=${inputTokens}  out=${outputTokens}  cache_w=${cacheWriteTokens}  cache_r=${cacheReadTokens}  ${costField}  ${durationField}`;

    process.stdout.write(`${line}\n`);
    try {
        appendFileSync(logFilePath, `${line}\n`);
    } catch {
        // non-critical
    }
}
