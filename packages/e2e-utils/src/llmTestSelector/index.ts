import Anthropic from '@anthropic-ai/sdk';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { error, log, output } from '../logger';
import type { CoverageIndex } from '../testCoverage/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = 'high' | 'medium' | 'low';

interface TestRecommendation {
    test: string;
    priority: Priority;
    reasoning: string;
    related_changes: string[];
}

interface SelectionResult {
    changed_files: string[];
    uncovered_changes: string[];
    recommendations: TestRecommendation[];
    summary: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COVERAGE_INDEX_URL = 'https://dev.suite.sldev.cz/coverage/e2e/index.json';
const LLM_ANALYSIS_URL = 'https://dev.suite.sldev.cz/coverage/e2e/llm-analysis.json';
const DEFAULT_COVERAGE_MAP_DIR = 'coverage-map';
const DEFAULT_INDEX_FILE = `${DEFAULT_COVERAGE_MAP_DIR}/index.json`;
const DEFAULT_LLM_ANALYSIS_FILE = `${DEFAULT_COVERAGE_MAP_DIR}/llm-analysis.json`;

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json']);

/**
 * Patterns for files that should be excluded from consideration even if their extension matches.
 * Lockfiles, markdown, and non-app config files.
 */
const EXCLUDED_PATTERNS = [
    /yarn\.lock$/,
    /package-lock\.json$/,
    /pnpm-lock\.yaml$/,
    /\.md$/,
    /\.config\.(ts|js|mjs|cjs)$/, // generic config files — app configs are matched below
];

/**
 * App-level config files that SHOULD be included despite matching *.config.ts.
 * These directly affect runtime app behaviour.
 */
const APP_CONFIG_ALLOWLIST = [/\/app\.config\.(ts|js)$/, /\/next\.config\.(ts|js|mjs)$/];

const OUTPUT_JSON_SCHEMA = JSON.stringify({
    type: 'object',
    properties: {
        recommendations: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    test: { type: 'string' },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                    reasoning: { type: 'string' },
                    related_changes: { type: 'array', items: { type: 'string' } },
                },
                required: ['test', 'priority', 'reasoning', 'related_changes'],
            },
        },
        summary: { type: 'string' },
        uncovered_changes: { type: 'array', items: { type: 'string' } },
    },
    required: ['recommendations', 'summary', 'uncovered_changes'],
});

// ---------------------------------------------------------------------------
// File filtering
// ---------------------------------------------------------------------------

const isAllowedFile = (filePath: string): boolean => {
    const ext = path.extname(filePath);
    if (!ALLOWED_EXTENSIONS.has(ext)) return false;

    const isAppConfig = APP_CONFIG_ALLOWLIST.some(re => re.test(filePath));
    if (isAppConfig) return true;

    const isExcluded = EXCLUDED_PATTERNS.some(re => re.test(filePath));

    return !isExcluded;
};

// ---------------------------------------------------------------------------
// Git diff
// ---------------------------------------------------------------------------

const getChangedFiles = (): string[] => {
    const result = spawnSync('git', ['diff', 'origin/develop...HEAD', '--name-only'], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (result.error) {
        throw new Error(`Failed to run git diff: ${result.error.message}`);
    }
    if (result.status !== 0) {
        throw new Error(`git diff exited with status ${result.status}:\n${result.stderr}`);
    }

    const files = result.stdout
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);

    // Deduplicate
    return [...new Set(files)].filter(isAllowedFile);
};

// ---------------------------------------------------------------------------
// Remote file download with etag / md5 freshness check
// ---------------------------------------------------------------------------

const downloadIfStale = async (url: string, localFile: string): Promise<void> => {
    const dir = path.dirname(localFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(localFile)) {
        try {
            const localMd5 = createHash('md5').update(fs.readFileSync(localFile)).digest('hex');
            const head = await fetch(url, { method: 'HEAD' });
            if (head.ok) {
                const remoteEtag = head.headers.get('etag')?.replace(/"/g, '');
                if (localMd5 === remoteEtag) {
                    log(`${path.basename(localFile)} is up to date, skipping download.`);

                    return;
                }
            } else {
                log(
                    `Freshness check for ${path.basename(localFile)} failed (${head.status}), using existing local file.`,
                );

                return;
            }
        } catch (err) {
            log(
                `Freshness check for ${path.basename(localFile)} failed (${err instanceof Error ? err.message : err}), using existing local file.`,
            );

            return;
        }
    }

    log(`Downloading ${path.basename(localFile)} from ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
        if (fs.existsSync(localFile)) {
            log(
                `Download failed (${response.status} ${response.statusText}), using existing local file.`,
            );

            return;
        }
        throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
    }
    const content = await response.text();
    fs.writeFileSync(localFile, content, 'utf8');
    log(`${path.basename(localFile)} downloaded successfully.`);
};

// ---------------------------------------------------------------------------
// Coverage-map lookup
// ---------------------------------------------------------------------------

const selectTestsByChangedFiles = (
    index: CoverageIndex,
    changedFiles: string[],
): { matched: string[]; uncovered: string[] } => {
    const matchedTestFiles = new Set<string>();
    const uncovered: string[] = [];

    for (const changedFile of changedFiles) {
        const tests = index[changedFile];
        if (tests && tests.length > 0) {
            tests.forEach(t => matchedTestFiles.add(t));
        } else {
            uncovered.push(changedFile);
        }
    }

    return { matched: [...matchedTestFiles], uncovered };
};

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

const buildPrompt = (
    changedFiles: string[],
    matchedTests: string[],
    uncoveredFiles: string[],
    llmAnalysis: Record<string, unknown>,
): string => `You are helping a CI/CD system identify which Playwright E2E tests to run based on code changes in a pull request.

## Your goal
Recommend the **minimal set of tests** that provides maximum confidence that the changed code works correctly, ranked by how critical each test is to run given these specific changes.

## Priority definitions
- **high**: The test directly exercises functionality that was changed, or a regression here would be immediately user-visible and hard to catch otherwise. Run these unconditionally.
- **medium**: The test covers functionality that shares infrastructure, state, or user flows with the changed code. A regression is plausible but not certain.
- **low**: The test is only loosely related (e.g. shares a common component or utility) and a regression is unlikely. Include only if time permits.

## Inputs

### Changed source files (${changedFiles.length})
${changedFiles.map(f => `- ${f}`).join('\n')}

### Tests identified by static coverage mapping (${matchedTests.length})
${matchedTests.length > 0 ? matchedTests.map(t => `- ${t}`).join('\n') : '(none — no static mapping available for these changes)'}

### Source files with no static coverage data (${uncoveredFiles.length})
${uncoveredFiles.length > 0 ? uncoveredFiles.map(f => `- ${f}`).join('\n') : '(none)'}

### LLM analysis of known tests
Each entry describes what a test does: its user-facing \`behaviors\`, \`entry_points\`, \`key_assertions\`, and \`source_hints\` (which parts of the app it touches).

\`\`\`json
${JSON.stringify(llmAnalysis, null, 2)}
\`\`\`

## Instructions
1. For every test returned by static coverage mapping, assign a **priority** and write a concise **reasoning** (1–3 sentences) that explains *why* this test matters given the specific changed files.
2. If static coverage mapping found no tests but you can infer from the LLM analysis that certain tests likely cover the changed functionality, include those with appropriate priority and note that they were inferred rather than statically mapped.
3. Populate **related_changes** with the subset of changed files that are most relevant to each test.
4. In **uncovered_changes** list the changed files that have no known test coverage at all (neither static nor inferred).
5. Write a short **summary** (2–4 sentences) describing the overall risk profile of this change set and the recommended test strategy.

## Output format
Return a single JSON object — no prose outside the JSON. The schema is:
\`\`\`json
{
  "recommendations": [
    {
      "test": "<relative path to test file>",
      "priority": "high" | "medium" | "low",
      "reasoning": "<why this test is relevant>",
      "related_changes": ["<changed file>", ...]
    }
  ],
  "summary": "<overall risk assessment and testing strategy>",
  "uncovered_changes": ["<changed file with no coverage>", ...]
}
\`\`\`

Sort recommendations by priority (high → medium → low), then alphabetically within each tier.`;

// ---------------------------------------------------------------------------
// Claude invocation — CLI
// ---------------------------------------------------------------------------

const selectTestsViaCli = (prompt: string): Promise<Omit<SelectionResult, 'changed_files'>> =>
    new Promise((resolve, reject) => {
        const proc = spawn(
            'claude',
            ['--print', '--output-format', 'json', '--json-schema', OUTPUT_JSON_SCHEMA],
            { stdio: ['pipe', 'pipe', 'pipe'] },
        );

        if (!proc.pid) {
            reject(
                new Error(
                    'Failed to start claude CLI. Is Claude Code installed? Run: npm install -g @anthropic-ai/claude-code',
                ),
            );

            return;
        }

        // Stream Claude's progress output (it writes status lines to stderr)
        proc.stderr.on('data', (chunk: Buffer) => {
            process.stderr.write(chunk);
        });

        let stdout = '';
        proc.stdout.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
        });

        proc.on('error', err => {
            reject(
                new Error(
                    `Failed to run claude CLI: ${err.message}\nIs Claude Code installed? Run: npm install -g @anthropic-ai/claude-code`,
                ),
            );
        });

        proc.on('close', code => {
            if (code !== 0) {
                reject(new Error(`claude exited with status ${code}`));

                return;
            }

            type Envelope = {
                is_error?: boolean;
                result?: string;
                structured_output?: Omit<SelectionResult, 'changed_files'>;
            };
            let envelope: Envelope;
            try {
                envelope = JSON.parse(stdout);
            } catch {
                reject(new Error(`claude returned unexpected output:\n${stdout}`));

                return;
            }

            if (envelope.is_error) {
                reject(new Error(`claude reported an error:\n${envelope.result}`));

                return;
            }
            if (!envelope.structured_output) {
                reject(new Error(`claude envelope missing structured_output:\n${stdout}`));

                return;
            }

            resolve(envelope.structured_output);
        });

        proc.stdin.end(prompt);
    });

// ---------------------------------------------------------------------------
// Claude invocation — API
// ---------------------------------------------------------------------------

const selectTestsViaApi = async (
    prompt: string,
    apiKey: string,
): Promise<Omit<SelectionResult, 'changed_files'>> => {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        tools: [
            {
                name: 'recommend_tests',
                description:
                    'Produce a structured recommendation of which E2E tests to run given a set of changed source files.',
                input_schema: {
                    type: 'object' as const,
                    properties: {
                        recommendations: {
                            type: 'array',
                            description:
                                'Ordered list of test recommendations (high → medium → low)',
                            items: {
                                type: 'object',
                                properties: {
                                    test: {
                                        type: 'string',
                                        description: 'Relative path to the test file',
                                    },
                                    priority: {
                                        type: 'string',
                                        enum: ['high', 'medium', 'low'],
                                        description: 'How critical this test is to run',
                                    },
                                    reasoning: {
                                        type: 'string',
                                        description:
                                            'Why this test matters given the specific changes (1–3 sentences)',
                                    },
                                    related_changes: {
                                        type: 'array',
                                        items: { type: 'string' },
                                        description:
                                            'Subset of changed files most relevant to this test',
                                    },
                                },
                                required: ['test', 'priority', 'reasoning', 'related_changes'],
                            },
                        },
                        summary: {
                            type: 'string',
                            description:
                                'Overall risk assessment and recommended testing strategy (2–4 sentences)',
                        },
                        uncovered_changes: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Changed files that have no known test coverage',
                        },
                    },
                    required: ['recommendations', 'summary', 'uncovered_changes'],
                },
            },
        ],
        tool_choice: { type: 'tool', name: 'recommend_tests' },
        messages: [{ role: 'user', content: prompt }],
    });

    type ContentBlock = { type: string; input?: unknown };
    const toolUse = (response.content as ContentBlock[]).find(b => b.type === 'tool_use');
    if (!toolUse) {
        throw new Error('Anthropic API did not return a tool_use block.');
    }

    const { input } = toolUse;
    if (
        typeof input !== 'object' ||
        input === null ||
        !Array.isArray((input as Record<string, unknown>).recommendations) ||
        typeof (input as Record<string, unknown>).summary !== 'string'
    ) {
        throw new Error(
            `Anthropic API returned malformed tool input:\n${JSON.stringify(input, null, 2)}`,
        );
    }

    return input as Omit<SelectionResult, 'changed_files'>;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
    const args = process.argv.slice(2);

    let apiKey: string | undefined;
    let indexFile = DEFAULT_INDEX_FILE;
    let llmAnalysisFile = DEFAULT_LLM_ANALYSIS_FILE;

    for (let i = 0; i < args.length; i++) {
        const nextArg = args[i + 1];
        if ((args[i] === '--api-key' || args[i] === '-k') && nextArg) {
            apiKey = nextArg;
            i++;
        } else if (args[i] === '--coverage-map' && nextArg) {
            indexFile = nextArg;
            i++;
        } else if (args[i] === '--llm-analysis' && nextArg) {
            llmAnalysisFile = nextArg;
            i++;
        }
    }

    // Fall back to env variable
    if (!apiKey && process.env.CLAUDE_API_KEY) {
        apiKey = process.env.CLAUDE_API_KEY;
    }

    if (args.includes('--help') || args.includes('-h')) {
        log(
            [
                'Usage: yarn workspace @trezor/e2e-utils select-tests-llm [options]',
                '',
                'Uses git diff origin/develop...HEAD to find changed files, maps them to E2E',
                'tests via the coverage index, downloads the LLM test analysis, then asks',
                'Claude to recommend which tests to run and at what priority.',
                '',
                'Options:',
                '  --api-key, -k <key>        Anthropic API key. Overrides the CLAUDE_API_KEY env',
                '                             variable. When provided, uses the Anthropic API',
                '                             instead of the local Claude Code CLI.',
                `  --coverage-map <file>      Path to the coverage index JSON. Default: ${DEFAULT_INDEX_FILE}`,
                `  --llm-analysis <file>      Path to the LLM analysis JSON. Default: ${DEFAULT_LLM_ANALYSIS_FILE}`,
                '  --help, -h                 Show this help message and exit.',
                '',
                'Output:',
                '  JSON object with:',
                '    changed_files      — filtered list of changed source files',
                '    recommendations    — tests sorted by priority (high/medium/low) with reasoning',
                '    summary            — overall risk and testing strategy',
                '    uncovered_changes  — changed files with no known test coverage',
                '',
                'Prerequisites (CLI mode, default):',
                '  claude CLI must be installed and authenticated (run `claude` to verify).',
                '',
                'Prerequisites (API mode):',
                '  Set CLAUDE_API_KEY env variable or pass --api-key <key>.',
                '',
                'Examples:',
                '  # Default (uses local Claude Code CLI):',
                '  yarn workspace @trezor/e2e-utils select-tests-llm',
                '',
                '  # Using the Anthropic API:',
                '  CLAUDE_API_KEY=sk-ant-... yarn workspace @trezor/e2e-utils select-tests-llm',
                '',
                '  # Pre-downloaded files:',
                '  yarn workspace @trezor/e2e-utils select-tests-llm \\',
                '    --coverage-map coverage-map/index.json \\',
                '    --llm-analysis coverage-map/llm-analysis.json',
            ].join('\n'),
        );
        process.exit(0);
    }

    // 1. Get changed files from git
    log('Collecting changed files from git diff origin/develop...HEAD...');
    let changedFiles: string[];
    try {
        changedFiles = getChangedFiles();
    } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exit(1);
    }

    if (changedFiles.length === 0) {
        log('No relevant changed files found (all filtered out or no diff vs origin/develop).');
        output(
            JSON.stringify(
                {
                    changed_files: [],
                    recommendations: [],
                    summary: 'No relevant source file changes detected against origin/develop.',
                    uncovered_changes: [],
                } satisfies SelectionResult,
                null,
                2,
            ),
        );
        process.exit(0);
    }
    log(`Found ${changedFiles.length} changed file(s) after filtering.`);

    // 2. Download / refresh coverage index
    try {
        await downloadIfStale(COVERAGE_INDEX_URL, indexFile);
    } catch (err) {
        error(`Could not obtain coverage index: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
    }

    if (!fs.existsSync(indexFile)) {
        error(`Coverage index not found at ${indexFile}.`);
        process.exit(1);
    }

    // 3. Download / refresh LLM analysis
    try {
        await downloadIfStale(LLM_ANALYSIS_URL, llmAnalysisFile);
    } catch (err) {
        error(`Could not obtain LLM analysis: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
    }

    if (!fs.existsSync(llmAnalysisFile)) {
        error(`LLM analysis not found at ${llmAnalysisFile}.`);
        process.exit(1);
    }

    // 4. Map changed files → tests via coverage index
    const index: CoverageIndex = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    const llmAnalysis: Record<string, unknown> = JSON.parse(
        fs.readFileSync(llmAnalysisFile, 'utf8'),
    );

    const { matched: matchedTests, uncovered: uncoveredFiles } = selectTestsByChangedFiles(
        index,
        changedFiles,
    );
    log(
        `Coverage mapping: ${matchedTests.length} test(s) matched, ${uncoveredFiles.length} file(s) with no coverage data.`,
    );

    // 5. Build prompt and call Claude
    const prompt = buildPrompt(changedFiles, matchedTests, uncoveredFiles, llmAnalysis);

    log(apiKey ? 'Calling Anthropic API...' : 'Calling local Claude Code CLI...');

    let claudeResult: Omit<SelectionResult, 'changed_files'>;
    try {
        claudeResult = apiKey
            ? await selectTestsViaApi(prompt, apiKey)
            : await selectTestsViaCli(prompt);
    } catch (err) {
        error(`Claude invocation failed: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
    }

    // 6. Emit result
    const result: SelectionResult = {
        changed_files: changedFiles,
        ...claudeResult,
    };

    output(JSON.stringify(result, null, 2));
};

main().catch(err => {
    error('[FATAL]', err);
    process.exit(1);
});
