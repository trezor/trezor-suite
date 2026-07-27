/* eslint-disable no-console */

const PRIORITY = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 } as const;
type Level = keyof typeof PRIORITY;

const isLevel = (name: string | undefined): name is Level => name !== undefined && name in PRIORITY;

// Default level is debug: decisions and their reasoning are shown, raw HTTP (trace) is not.
const envLevel = process.env.LOG_LEVEL?.toLowerCase();
let currentLevel: Level = isLevel(envLevel) ? envLevel : 'debug';

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

export function configureLogLevelFromArgs(args: string[]): void {
    const flagIndex = args.indexOf('--log-level');
    if (flagIndex === -1) return;

    const requested = args[flagIndex + 1]?.toLowerCase();
    if (isLevel(requested)) {
        currentLevel = requested;
    }
}

function safeFormat(input: unknown): string {
    if (typeof input === 'string') return input;
    if (input instanceof Error)
        return `${input.name}: ${input.message}${input.stack ? `\n${input.stack}` : ''}`;
    try {
        return JSON.stringify(input, null, 2);
    } catch {
        return String(input);
    }
}

interface Problem {
    level: 'error' | 'warn';
    category: string;
    message: string;
}

const problems: Problem[] = [];

function emit(level: Level, category: string, args: unknown[]): void {
    const message = args.map(safeFormat).join(' ');

    // Collect errors/warnings for a summary at the end of the run
    if (level === 'error' || level === 'warn') {
        problems.push({ level, category, message });
    }

    if (PRIORITY[level] > PRIORITY[currentLevel]) return;

    // INFO is the human-readable stream — keep it clean (headers already carry context).
    if (level === 'info') {
        process.stderr.write(`${message}\n`);
    } else {
        process.stderr.write(`[${level}] ${category} ${message}\n`);
    }
}

export function createLogger(category = '') {
    return {
        error: (...args: unknown[]) => emit('error', category, args),
        warn: (...args: unknown[]) => emit('warn', category, args),
        /** INFO — headers and decisions. */
        log: (...args: unknown[]) => emit('info', category, args),
        debug: (...args: unknown[]) => emit('debug', category, args),
        trace: (...args: unknown[]) => emit('trace', category, args),
        groupEnd: () => {
            if (isGithubActions) process.stderr.write('::endgroup::\n');
        },
    };
}

// Backward compatibility export
export const { error, warn, log } = createLogger();

/**
 * Print the collected warnings/errors as a dedicated end-of-run section and,
 * in GitHub Actions, emit them as workflow annotations. Returns the count.
 */
export function printProblemSummary(): number {
    const errorCount = problems.filter(p => p.level === 'error').length;
    const warnCount = problems.length - errorCount;

    if (problems.length === 0) {
        process.stderr.write('\n✓ No problems.\n');

        return 0;
    }

    // Condensed digest of collected problems
    process.stderr.write(`\n=== Problems (${errorCount} error, ${warnCount} warn) ===\n`);
    for (const p of problems) {
        const cat = p.category ? ` [${p.category}]` : '';
        const firstLine = p.message.split('\n', 1)[0];
        process.stderr.write(`[${p.level}]${cat} ${firstLine}\n`);
        if (isGithubActions) {
            const command = p.level === 'error' ? 'error' : 'warning';
            process.stderr.write(
                `::${command}::${p.category ? `[${p.category}] ` : ''}${firstLine}\n`,
            );
        }
    }

    return errorCount;
}

/** Write data output to stdout. Use only for machine-readable command output (e.g. JSON reports). */
export function output(...args: unknown[]): void {
    console.log(...args);
}
