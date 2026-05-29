import { reportTokenUsage } from '../tokenUsage';
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

export function processAgentOutput(
    rawOutput: string,
    agent: 'nightlyAnalyzer' | 'nightlyFixer',
    model: string,
): void {
    let result: ClaudeResult = {};
    try {
        result = parseClaudeOutput(rawOutput);
    } catch {
        process.stderr.write(`[${agent}] agent output unparsable (${rawOutput.length} bytes)\n`);

        return;
    }

    const subtype = result.subtype ?? '?';
    const text = result.result ?? '';
    const preview = text.length > 800 ? `${text.slice(0, 800)}…` : text;

    process.stderr.write(`[${agent}] subtype=${subtype}\n`);
    if (preview) process.stderr.write(`${preview}\n`);

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
}
