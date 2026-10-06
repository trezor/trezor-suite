export type DiagnosticLevel = 'info' | 'warn' | 'error';

export type DiagnosticDetails = Record<string, unknown>;

export type DiagnosticEntry = {
    /** Milliseconds since the log was created, which is the page load. */
    elapsedMs: number;
    level: DiagnosticLevel;
    category: string;
    message: string;
    details?: DiagnosticDetails;
};

export type DiagnosticLog = {
    info: (category: string, message: string, details?: DiagnosticDetails) => void;
    warn: (category: string, message: string, details?: DiagnosticDetails) => void;
    error: (category: string, message: string, details?: DiagnosticDetails) => void;
    getEntries: () => readonly DiagnosticEntry[];
    subscribe: (listener: () => void) => () => void;
    /** Plain text with a header, meant to be pasted into a bug report. */
    toText: () => string;
};

export type CreateDiagnosticLogParams = {
    now?: () => number;
    /** Receives every entry as well, such as the browser console. */
    sink?: (entry: DiagnosticEntry) => void;
    /** Lines placed above the entries in the text export. */
    getHeader?: () => Record<string, string>;
};

/** Older entries are dropped beyond this count. A whole migration stays far below it. */
export const MAX_DIAGNOSTIC_ENTRIES = 3000;

const formatElapsed = (elapsedMs: number) => `+${(elapsedMs / 1000).toFixed(3)}s`;

const formatDetails = (details: DiagnosticDetails | undefined) => {
    if (!details) return '';

    try {
        return ` ${JSON.stringify(details)}`;
    } catch {
        return ' [details not serializable]';
    }
};

export const formatDiagnosticEntry = ({
    elapsedMs,
    level,
    category,
    message,
    details,
}: DiagnosticEntry) =>
    `${formatElapsed(elapsedMs)} ${level.toUpperCase()} [${category}] ${message}${formatDetails(details)}`;

/**
 * In-memory log of what the page did, kept so that a tester without developer tools can copy
 * it and send it back. Callers must not put anything confidential into it: no PIN, passphrase,
 * seed, address, public key, transaction id or amount. The log is never sent anywhere by the
 * page itself.
 */
export const createDiagnosticLog = ({
    now = () => Date.now(),
    sink,
    getHeader = () => ({}),
}: CreateDiagnosticLogParams = {}): DiagnosticLog => {
    const createdAt = now();
    const entries: DiagnosticEntry[] = [];
    const listeners = new Set<() => void>();
    // Snapshot handed to React. A new array only when something changed.
    let snapshot: readonly DiagnosticEntry[] = [];

    const push = (
        level: DiagnosticLevel,
        category: string,
        message: string,
        details?: DiagnosticDetails,
    ) => {
        const entry: DiagnosticEntry = {
            elapsedMs: now() - createdAt,
            level,
            category,
            message,
            ...(details ? { details } : {}),
        };
        entries.push(entry);
        if (entries.length > MAX_DIAGNOSTIC_ENTRIES) entries.shift();
        snapshot = [...entries];

        sink?.(entry);
        listeners.forEach(listener => listener());
    };

    return {
        info: (category, message, details) => push('info', category, message, details),
        warn: (category, message, details) => push('warn', category, message, details),
        error: (category, message, details) => push('error', category, message, details),
        getEntries: () => snapshot,
        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
        toText: () => {
            const header = Object.entries({
                ...getHeader(),
                'Log created': new Date(createdAt).toISOString(),
                'Log exported': new Date(now()).toISOString(),
            }).map(([key, value]) => `${key}: ${value}`);

            return [...header, '', ...entries.map(formatDiagnosticEntry)].join('\n');
        },
    };
};

/** Describes an error for the log without assuming anything about its shape. */
export const describeError = (error: unknown): DiagnosticDetails =>
    error instanceof Error
        ? {
              name: error.name,
              message: error.message,
              ...(error.stack ? { stack: error.stack } : {}),
          }
        : { value: String(error) };

const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

const consoleSink = (entry: DiagnosticEntry) => {
    const line = formatDiagnosticEntry(entry);
    switch (entry.level) {
        case 'info':
            // The console is the second sink of the log, so plain output is the point here.
            // eslint-disable-next-line no-console
            console.info(line);
            break;
        case 'warn':
            console.warn(line);
            break;
        case 'error':
            console.error(line);
            break;
        // no default
    }
};

const getBrowserHeader = () => ({
    'App commit': typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : 'unknown',
    'Page origin': window.location.origin,
    'User agent': navigator.userAgent,
    Language: navigator.language,
});

/** The log of this page. Outside the browser (unit tests) it only collects entries. */
export const diagnosticLog = createDiagnosticLog(
    isBrowser ? { sink: consoleSink, getHeader: getBrowserHeader } : {},
);
