import { AgentMessageEntrySchema, type ClaudeResult } from './schemas';

export type AgentName = 'nightlyAnalyzer' | 'nightlyFixer';

const STAGE_MARKER = /fixagent-stage-([a-z0-9-]+)/g;

// Token prices relative to the base input price: cache reads bill at ~0.1×, cache
// writes at ~2× (Claude Code's 1-hour cache TTL). Output is excluded — the CLI does
// not report usable per-message output tokens, so it cannot be attributed to a
// stage. The base price cancels out when shares are normalised, so these relative
// weights are model-independent.
const CACHE_READ_WEIGHT = 0.1;
const CACHE_WRITE_WEIGHT = 2;

const INITIAL_STAGE = 'setup';

interface StageUsage {
    messages: number;
    inputTokens: number;
    cacheWriteTokens: number;
    cacheReadTokens: number;
}

const emptyStage = (): StageUsage => ({
    messages: 0,
    inputTokens: 0,
    cacheWriteTokens: 0,
    cacheReadTokens: 0,
});

const stageWeight = (stage: StageUsage): number =>
    stage.inputTokens +
    stage.cacheWriteTokens * CACHE_WRITE_WEIGHT +
    stage.cacheReadTokens * CACHE_READ_WEIGHT;

// The stage a tool-use call opens, or null if it carries no marker. When a single
// command chains several markers, the last one wins.
const stageOpenedBy = (input: Record<string, unknown> | undefined): string | null => {
    const command = typeof input?.command === 'string' ? input.command : '';

    return [...command.matchAll(STAGE_MARKER)].at(-1)?.[1] ?? null;
};

function attributeStageCosts(entries: unknown[]): {
    stages: Map<string, StageUsage>;
    warnings: Set<string>;
} {
    const stages = new Map<string, StageUsage>();
    const countedMessageIds = new Set<string>();
    const warnings = new Set<string>();
    let currentStage = INITIAL_STAGE;

    for (const rawEntry of entries) {
        const parsed = AgentMessageEntrySchema.safeParse(rawEntry);
        if (!parsed.success) continue; // skip system / user / result / rate-limit entries

        const { message, parent_tool_use_id: parentToolUseId } = parsed.data;

        // Flip the stage as soon as a marker appears, so the marker message itself
        // is attributed to the stage it opens.
        for (const block of message.content) {
            if (block.type === 'tool_use')
                currentStage = stageOpenedBy(block.input) ?? currentStage;
        }

        // --verbose repeats one message once per content block; count usage once.
        if (countedMessageIds.has(message.id)) continue;
        countedMessageIds.add(message.id);

        if (parentToolUseId) warnings.add(`sub-agent activity attributed to "${currentStage}"`);

        const usage = message.usage ?? {};
        const stage = stages.get(currentStage) ?? emptyStage();
        stage.messages += 1;
        stage.inputTokens += usage.input_tokens ?? 0;
        stage.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
        stage.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
        stages.set(currentStage, stage);
    }

    return { stages, warnings };
}

function formatTable(headers: string[], rows: string[][]): string {
    const widths = headers.map((header, column) =>
        Math.max(header.length, ...rows.map(row => (row[column] ?? '').length)),
    );
    const renderRow = (cells: string[]) =>
        cells
            .map((cell, column) => {
                const width = widths[column] ?? 0;

                return column === 0 ? cell.padEnd(width) : cell.padStart(width);
            })
            .join('  ');

    return [renderRow(headers), ...rows.map(renderRow)].join('\n');
}

// Per-stage cost breakdown for terminal logging. Input and cache tokens are
// attributed exactly per stage; the `~cost` column distributes the authoritative
// total_cost_usd by each stage's input+cache weight. Output tokens cannot be placed
// per stage, so they are folded into that split proportionally and also reported as
// a run-level figure.
export function formatStageBreakdown(
    agent: AgentName,
    entries: unknown[],
    result: ClaudeResult,
): string | null {
    const { stages, warnings } = attributeStageCosts(entries);
    if (stages.size === 0) return null;

    const totalWeight = [...stages.values()].reduce((sum, stage) => sum + stageWeight(stage), 0);
    const totalCost = result.total_cost_usd;

    const rows = [...stages.entries()].map(([name, stage]) => {
        const share = totalWeight > 0 ? stageWeight(stage) / totalWeight : 0;

        return [
            name,
            String(stage.messages),
            String(stage.inputTokens),
            String(stage.cacheWriteTokens),
            String(stage.cacheReadTokens),
            `${(share * 100).toFixed(1)}%`,
            totalCost !== undefined ? `$${(share * totalCost).toFixed(4)}` : '—',
        ];
    });

    const table = formatTable(
        ['stage', 'msgs', 'input', 'cache write', 'cache read', 'share', '~cost'],
        rows,
    );

    const outputTokens = result.usage?.output_tokens ?? 0;
    const footer =
        `output: ${outputTokens} tok (run-level, folded into the split) ` +
        (totalCost !== undefined ? `· run total: $${totalCost.toFixed(4)}` : '');

    return [
        `Stage cost breakdown — ${agent}`,
        table,
        footer,
        ...[...warnings].map(w => `⚠ ${w}`),
    ].join('\n');
}
