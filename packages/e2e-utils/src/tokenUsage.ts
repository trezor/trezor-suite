import { appendFileSync, writeFileSync } from 'node:fs';

export interface UsageRecord {
    timestamp: string;
    run_id: string;
    script: 'llmTestAnalyzer' | 'llmTestSelector';
    model: string;
    input_tokens: number | null;
    output_tokens: number | null;
    source: 'api' | 'cli';
    workflow: string | null;
    pr_number: string | null;
}

// Pricing for claude-opus-4-6 in USD per million tokens (as of 2026-05)
const PRICE_INPUT_PER_MTOK = 15;
const PRICE_OUTPUT_PER_MTOK = 75;

// Module-level accumulator for scripts that make many API calls per invocation (e.g. llmTestAnalyzer).
let _inputTokens = 0;
let _outputTokens = 0;

export function accumulateApiUsage(response: {
    usage: { input_tokens: number; output_tokens: number };
}): void {
    _inputTokens += response.usage.input_tokens;
    _outputTokens += response.usage.output_tokens;
}

export function getAccumulatedUsage(): { input_tokens: number; output_tokens: number } {
    return { input_tokens: _inputTokens, output_tokens: _outputTokens };
}

export function reportTokenUsage(record: UsageRecord): void {
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
        const fmt = (n: number | null) => (n != null ? `${(n / 1000).toFixed(1)}k` : 'n/a');
        const escapeMd = (s: string) =>
            s
                .replace(/[\n\r]/g, ' ')
                .replace(/\\/g, '\\\\')
                .replace(/\|/g, '\\|');
        const cost =
            record.input_tokens != null && record.output_tokens != null
                ? `$${(
                      (record.input_tokens / 1_000_000) * PRICE_INPUT_PER_MTOK +
                      (record.output_tokens / 1_000_000) * PRICE_OUTPUT_PER_MTOK
                  ).toFixed(4)}`
                : 'n/a';
        const md = [
            '\n## Token Usage\n',
            '| Script | Model | Input | Output | Est. Cost | Source |',
            '|--------|-------|-------|--------|-----------|--------|',
            `| ${escapeMd(record.script)} | ${escapeMd(record.model)} | ${fmt(record.input_tokens)} | ${fmt(record.output_tokens)} | ${cost} | ${escapeMd(record.source)} |`,
            '',
        ].join('\n');
        try {
            appendFileSync(summaryPath, md);
        } catch {
            // non-critical
        }
    }
}
