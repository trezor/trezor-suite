/* eslint-disable no-console */
let verbose = false;

export function setVerbose(enabled: boolean): void {
    verbose = enabled;
}

/** Progress/info log — always printed to stderr. */
export function log(...args: unknown[]): void {
    console.error(...args);
}

/** Error log — always printed to stderr, prefixed with [error]. */
export function error(...args: unknown[]): void {
    console.error('[error]', ...args);
}

/** Warn log — always printed to stderr, prefixed with [warn]. */
export function warn(...args: unknown[]): void {
    console.warn('[warn]', ...args);
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

/**
 * Debug log — only printed when --verbose is active. Goes to stderr.
 * Prefixed with [debug] to distinguish from normal log output.
 */
export function debug(...args: unknown[]): void {
    if (!verbose) return;
    const msg = args.map(safeFormat).join(' ');
    process.stderr.write(`[debug] ${msg}\n`);
}

/** Write data output to stdout. Use only for machine-readable command output (e.g. JSON reports). */
export function output(...args: unknown[]): void {
    console.log(...args);
}
