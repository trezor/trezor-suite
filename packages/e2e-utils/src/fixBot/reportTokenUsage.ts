// TODO: This will removed and replaced by packages/e2e-utils/src/tokenUsage.ts
// when implementation gets to GHA stage
import { appendFileSync } from 'node:fs';

interface ClaudeUsage {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
}

interface ClaudeResult {
    type?: string;
    num_turns?: number;
    usage?: ClaudeUsage;
    total_cost_usd?: number;
    duration_ms?: number;
}

function parseClaudeOutput(raw: string): ClaudeResult {
    const parsed: unknown = JSON.parse(raw.trim());
    if (Array.isArray(parsed)) {
        return (parsed as ClaudeResult[]).find(entry => entry.type === 'result') ?? {};
    }

    return parsed as ClaudeResult;
}

function formatIntegerWithCommas(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatTimestamp(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}Z`;
}

export function reportTokenUsage(rawOutput: string, logFilePath: string, agentName: string): void {
    let result: ClaudeResult = {};
    try {
        result = parseClaudeOutput(rawOutput);
    } catch {
        // malformed — fall through with empty result (zeroed/blank line)
    }

    const timestamp = formatTimestamp(new Date());
    const paddedAgentName = agentName.padEnd(20).slice(0, 20);

    const turnsField = result.num_turns != null ? String(result.num_turns).padStart(3) : 'N/A';

    const formatTokenCount = (tokenCount: number | undefined) =>
        formatIntegerWithCommas(tokenCount ?? 0).padStart(9);

    const inputTokens = formatTokenCount(result.usage?.input_tokens);
    const outputTokens = formatTokenCount(result.usage?.output_tokens);
    const cacheWriteTokens = formatTokenCount(result.usage?.cache_creation_input_tokens);
    const cacheReadTokens = formatTokenCount(result.usage?.cache_read_input_tokens);

    const costField =
        result.total_cost_usd != null
            ? `$${result.total_cost_usd.toFixed(4).padStart(8)}`
            : '         ';

    const durationField =
        result.duration_ms != null
            ? `${String(Math.round(result.duration_ms / 1000)).padStart(5)}s`
            : '      ';

    const line = `${timestamp}  ${paddedAgentName}  turns=${turnsField}  in=${inputTokens}  out=${outputTokens}  cache_w=${cacheWriteTokens}  cache_r=${cacheReadTokens}  ${costField}  ${durationField}`;

    process.stdout.write(`${line}\n`);
    try {
        appendFileSync(logFilePath, `${line}\n`);
    } catch {
        // non-critical
    }
}
