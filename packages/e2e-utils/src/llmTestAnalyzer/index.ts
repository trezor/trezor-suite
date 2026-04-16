import Anthropic from '@anthropic-ai/sdk';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { error, log, output } from '../logger';

interface ClaudeAnalysis {
    behaviors: string[];
    entry_points: string[];
    key_assertions: string[];
    source_hints: string[];
}

interface TestAnalysis extends ClaudeAnalysis {
    sha256: string;
}

const JSON_SCHEMA = JSON.stringify({
    type: 'object',
    properties: {
        behaviors: { type: 'array', items: { type: 'string' } },
        entry_points: { type: 'array', items: { type: 'string' } },
        key_assertions: { type: 'array', items: { type: 'string' } },
        source_hints: { type: 'array', items: { type: 'string' } },
    },
    required: ['behaviors', 'entry_points', 'key_assertions', 'source_hints'],
});

const buildPrompt = (testSource: string) =>
    `Given this Playwright test file, produce a JSON summary with ALL four of the following fields. All four fields are REQUIRED and must appear in the output — do not skip any of them.

1. behaviors: list of user-facing behaviors this test validates (plain English)
2. entry_points: URLs or UI flows where the test begins
3. key_assertions: what conditions it checks
4. source_hints: which parts of the application source code this test likely touches (e.g. component names, Redux slices, API endpoints, utility modules). Use ["unknown"] if genuinely indeterminate, but this field MUST always be present.

IMPORTANT: Omitting any field — especially source_hints — is not acceptable. If uncertain about source_hints, use ["unknown"].

Test file contents:
\`\`\`
${testSource}
\`\`\``;

const hashContent = (content: string): string => createHash('sha256').update(content).digest('hex');

const requiredKeys: (keyof ClaudeAnalysis)[] = [
    'behaviors',
    'entry_points',
    'key_assertions',
    'source_hints',
];

const validateAnalysis = (input: unknown, context: string): ClaudeAnalysis => {
    if (typeof input !== 'object' || input === null) {
        throw new Error(`Expected an object, got ${typeof input}: ${context}`);
    }
    const record = input as Record<string, unknown>;
    for (const key of requiredKeys) {
        if (
            !Array.isArray(record[key]) ||
            !record[key].every((v: unknown) => typeof v === 'string')
        ) {
            throw new Error(`Missing or invalid field "${key}" in analysis: ${context}`);
        }
    }

    return input as ClaudeAnalysis;
};

const findTestFiles = (inputPath: string, excludePatterns: string[] = []): string[] => {
    const absolutePath = path.resolve(inputPath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Path not found: ${absolutePath}`);
    }

    const stat = fs.statSync(absolutePath);

    const rootForRelative = stat.isDirectory() ? absolutePath : path.dirname(absolutePath);
    const isExcluded = (filePath: string): boolean => {
        const relPath = path.relative(rootForRelative, filePath);

        return excludePatterns.some(pattern => path.matchesGlob(relPath, pattern));
    };

    if (stat.isFile()) {
        return isExcluded(absolutePath) ? [] : [absolutePath];
    }

    if (stat.isDirectory()) {
        const results: string[] = [];
        const recurse = (dir: string) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    recurse(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
                    if (!isExcluded(fullPath)) {
                        results.push(fullPath);
                    }
                }
            }
        };
        recurse(absolutePath);

        return results;
    }

    throw new Error(`Path is neither a file nor a directory: ${absolutePath}`);
};

const DEFAULT_CACHE_FILE = 'coverage-map/llm-analysis.json';

const analyzeTestFileViaCli = (testSource: string): ClaudeAnalysis => {
    const result = spawnSync(
        'claude',
        ['--print', '--output-format', 'json', '--json-schema', JSON_SCHEMA],
        {
            input: buildPrompt(testSource),
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        },
    );

    if (result.error) {
        throw new Error(
            `Failed to run claude CLI: ${result.error.message}\nIs Claude Code installed? Run: npm install -g @anthropic-ai/claude-code`,
        );
    }

    if (result.status !== 0) {
        throw new Error(`claude exited with status ${result.status}:\n${result.stderr}`);
    }

    // --output-format json with --json-schema puts structured data in envelope.structured_output
    let envelope: { is_error?: boolean; result?: string; structured_output?: ClaudeAnalysis };
    try {
        envelope = JSON.parse(result.stdout);
    } catch {
        throw new Error(`claude returned unexpected output:\n${result.stdout}`);
    }

    if (envelope.is_error) {
        throw new Error(`claude reported an error:\n${envelope.result}`);
    }

    if (!envelope.structured_output) {
        throw new Error(`claude envelope missing structured_output:\n${result.stdout}`);
    }

    return validateAnalysis(envelope.structured_output, result.stdout);
};

const analyzeTestFileViaApi = async (
    testSource: string,
    filePath: string,
    apiKey: string,
): Promise<ClaudeAnalysis> => {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        tools: [
            {
                name: 'summarize_test',
                description: 'Produce a structured summary of a Playwright test file.',
                input_schema: {
                    type: 'object' as const,
                    properties: {
                        behaviors: {
                            type: 'array',
                            items: { type: 'string' },
                            description:
                                'User-facing behaviors this test validates (plain English)',
                        },
                        entry_points: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'URLs or UI flows where the test begins',
                        },
                        key_assertions: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Conditions the test checks',
                        },
                        source_hints: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Parts of the application the test likely touches',
                        },
                    },
                    required: ['behaviors', 'entry_points', 'key_assertions', 'source_hints'],
                },
            },
        ],
        tool_choice: { type: 'tool', name: 'summarize_test' },
        messages: [{ role: 'user', content: buildPrompt(testSource) }],
    });

    type ContentBlock = { type: string; input?: unknown };
    const toolUse = (response.content as ContentBlock[]).find(block => block.type === 'tool_use');
    if (!toolUse) {
        throw new Error(`Anthropic API did not return a tool_use block for: ${filePath}`);
    }

    const { input } = toolUse;

    return validateAnalysis(input, `Anthropic API response for: ${filePath}`);
};

const analyzeTestFile = async (filePath: string, apiKey?: string): Promise<TestAnalysis> => {
    const testSource = fs.readFileSync(filePath, 'utf8');

    if (!testSource.trim()) {
        throw new Error(`Test file is empty: ${filePath}`);
    }

    log(`Analyzing ${filePath}...`);

    const analysis = apiKey
        ? await analyzeTestFileViaApi(testSource, filePath, apiKey)
        : analyzeTestFileViaCli(testSource);

    return {
        sha256: hashContent(testSource),
        ...analysis,
    };
};

const readCache = (cacheFile: string): Record<string, TestAnalysis> => {
    if (!fs.existsSync(cacheFile)) return {};
    try {
        return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    } catch {
        return {};
    }
};

const writeCache = (cacheFile: string, cache: Record<string, TestAnalysis>): void => {
    const dir = path.dirname(cacheFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf8');
};

const main = async () => {
    const args = process.argv.slice(2);
    const buildCache = args.includes('--buildCache');
    const positionalArgs = args.filter(a => !a.startsWith('--'));

    const excludePatterns: string[] = [];
    for (let i = 0; i < args.length; i++) {
        const nextArg = args[i + 1];
        if (args[i] === '--exclude' && nextArg) {
            excludePatterns.push(nextArg);
            i++;
        }
    }

    let cacheFile = DEFAULT_CACHE_FILE;
    const cacheFileIdx = args.indexOf('--cache-file');
    const cacheFileArg = args[cacheFileIdx + 1];
    if (cacheFileIdx !== -1 && cacheFileArg) {
        cacheFile = cacheFileArg;
    }

    let apiKey: string | undefined;
    const apiKeyIdx = args.indexOf('--api-key');
    if (apiKeyIdx !== -1 && args[apiKeyIdx + 1]) {
        apiKey = args[apiKeyIdx + 1];
    } else if (process.env.CLAUDE_API_KEY) {
        apiKey = process.env.CLAUDE_API_KEY;
    }

    if (args.includes('--help') || args.includes('-h') || positionalArgs.length === 0) {
        log(
            [
                'Usage: yarn workspace @trezor/e2e-utils analyze-tests <path> [options]',
                '',
                'Analyzes Playwright test file(s) using Claude and produces a structured JSON',
                'summary. Supports two backends: the Claude Code CLI (default) or the Anthropic',
                'API (when an API key is provided).',
                '',
                'Arguments:',
                '  <path>              Path to a .test.ts file or a folder to scan recursively',
                '',
                'Options:',
                '  --buildCache        Build/update the analysis cache file instead of printing.',
                '                      Skips files whose sha256 hash has not changed since last run.',
                `  --cache-file <path> Path to the cache file. Default: ${DEFAULT_CACHE_FILE}`,
                '  --exclude <pattern> Glob pattern for files to exclude. Can be repeated.',
                '                      Example: --exclude "**/manual/**"',
                '  --api-key <key>     Anthropic API key. Overrides the CLAUDE_API_KEY env variable.',
                '                      When provided, uses the Anthropic API instead of the CLI.',
                '  --help, -h          Show this help message and exit.',
                '',
                'Output fields:',
                '  sha256          SHA-256 hash of the test file (used for cache invalidation)',
                '  behaviors       User-facing behaviors the test validates (plain English)',
                '  entry_points    URLs or UI flows where the test begins',
                '  key_assertions  Conditions the test checks',
                '  source_hints    Parts of the application the test likely touches',
                '',
                'Prerequisites (CLI mode, default):',
                '  claude CLI must be installed and authenticated (run `claude` to verify).',
                '',
                'Prerequisites (API mode):',
                '  Set CLAUDE_API_KEY env variable or pass --api-key <key>.',
                '',
                'Examples:',
                '  yarn workspace @trezor/e2e-utils analyze-tests \\',
                '    ../../suite/e2e/tests/wallet/cardano.test.ts',
                '',
                '  yarn workspace @trezor/e2e-utils analyze-tests \\',
                '    ../../suite/e2e/tests/ --buildCache',
                '',
                '  CLAUDE_API_KEY=sk-ant-... yarn workspace @trezor/e2e-utils analyze-tests \\',
                '    ../../suite/e2e/tests/ --buildCache --cache-file coverage-map/llm-analysis.json',
                '',
                '  yarn workspace @trezor/e2e-utils analyze-tests \\',
                '    ../../suite/e2e/tests/ --api-key sk-ant-...',
            ].join('\n'),
        );
        process.exit(positionalArgs.length === 0 ? 1 : 0);
    }

    const inputPath = positionalArgs[0];
    if (!inputPath) {
        error('No input path provided.');
        process.exit(1);
    }
    let testFiles: string[];
    try {
        testFiles = findTestFiles(inputPath, excludePatterns);
    } catch (err) {
        error(err instanceof Error ? err.message : String(err));
        process.exit(1);
    }

    if (testFiles.length === 0) {
        error(`No *.test.ts files found in: ${inputPath}`);
        process.exit(1);
    }

    if (buildCache) {
        const cache = readCache(cacheFile);
        let failed = 0;
        for (const testFile of testFiles) {
            try {
                const relPath = path.relative(process.cwd(), testFile);
                const testSource = fs.readFileSync(testFile, 'utf8');
                const currentHash = hashContent(testSource);
                const cached = cache[relPath];
                if (cached?.sha256 === currentHash) {
                    log(`Cache up-to-date, skipping ${relPath}`);
                    continue;
                }
                cache[relPath] = await analyzeTestFile(testFile, apiKey);
            } catch (err) {
                error(`Failed to analyze ${testFile}:`, err instanceof Error ? err.message : err);
                failed++;
            }
        }
        writeCache(cacheFile, cache);
        log(`Cache written: ${cacheFile}`);
        if (failed > 0) process.exit(1);
    } else {
        const firstTestFile = testFiles[0];
        if (testFiles.length === 1 && firstTestFile) {
            const analysis = await analyzeTestFile(firstTestFile, apiKey);
            output(JSON.stringify(analysis, null, 2));
        } else {
            const results: Record<string, TestAnalysis> = {};
            let failed = 0;
            for (const testFile of testFiles) {
                try {
                    results[testFile] = await analyzeTestFile(testFile, apiKey);
                } catch (err) {
                    error(
                        `Failed to analyze ${testFile}:`,
                        err instanceof Error ? err.message : err,
                    );
                    failed++;
                }
            }
            output(JSON.stringify(results, null, 2));
            if (failed > 0) process.exit(1);
        }
    }
};

main();
