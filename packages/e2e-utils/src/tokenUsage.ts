import { appendFileSync, writeFileSync } from 'node:fs';

export interface UsageRecord {
    timestamp: string;
    run_id: string;
    script: 'llmTestAnalyzer' | 'llmTestSelector' | 'nightlyAnalyzer' | 'nightlyFixer';
    model: string;
    input_tokens: number | null;
    output_tokens: number | null;
    source: 'api' | 'cli';
    workflow: string | null;
    pr_number: string | null;
    total_cost_usd?: number;
}

// Pricing for claude-opus-4-6 in USD per million tokens (as of 2026-05)
const PRICE_INPUT_PER_MTOK = 15;
const PRICE_OUTPUT_PER_MTOK = 75;

// Module-level accumulator for scripts that make many API calls per invocation (e.g. llmTestAnalyzer).
let _inputTokens = 0;
let _outputTokens = 0;

const formatTokens = (n: number | null) => (n != null ? `${(n / 1000).toFixed(1)}k` : 'n/a');
const escapeMarkdown = (s: string) =>
    s
        .replace(/[\n\r]/g, ' ')
        .replace(/\\/g, '\\\\')
        .replace(/\|/g, '\\|');

export function resolveCost(record: UsageRecord) {
    // Agentic usage provides cost
    if (record.total_cost_usd != null) {
        return record.total_cost_usd;
    }

    // API usage needs cost calculation
    if (record.input_tokens != null && record.output_tokens != null) {
        return (
            (record.input_tokens / 1_000_000) * PRICE_INPUT_PER_MTOK +
            (record.output_tokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK
        );
    } else {
        return undefined;
    }
}

export function accumulateApiUsage(response: {
    usage: { input_tokens: number; output_tokens: number };
}): void {
    _inputTokens += response.usage.input_tokens;
    _outputTokens += response.usage.output_tokens;
}

export function getAccumulatedUsage(): { input_tokens: number; output_tokens: number } {
    return { input_tokens: _inputTokens, output_tokens: _outputTokens };
}

export function reportTokenUsage(recordRaw: UsageRecord): void {
    const record: UsageRecord = {
        ...recordRaw,
        total_cost_usd: resolveCost(recordRaw),
    };

    // Always emit to stderr — visible locally and in CI logs.
    process.stderr.write(`[TOKEN_USAGE] ${JSON.stringify(record)}\n`);

    // Write to a known temp path so GH Actions steps can read it without stderr capture.
    if (process.env.GITHUB_ACTIONS) {
        try {
            writeFileSync('/tmp/llm-token-usage.json', JSON.stringify(record));
        } catch {
            // non-critical
        }
    }

    // Append a markdown table to the step summary shown in the GH Actions UI.
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
        const cost = record.total_cost_usd != null ? `$${record.total_cost_usd.toFixed(4)}` : 'N/A';
        const tokenUsageMarkdown = [
            '\n## Token Usage\n',
            '| Script | Model | Input | Output | Est. Cost | Source |',
            '|--------|-------|-------|--------|-----------|--------|',
            `| ${escapeMarkdown(record.script)} | ${escapeMarkdown(record.model)} | ${formatTokens(record.input_tokens)} | ${formatTokens(record.output_tokens)} | ${cost} | ${escapeMarkdown(record.source)} |`,
            '',
        ].join('\n');
        try {
            appendFileSync(summaryPath, tokenUsageMarkdown);
        } catch {
            // non-critical
        }
    }
}
