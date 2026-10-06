import {
    MAX_DIAGNOSTIC_ENTRIES,
    createDiagnosticLog,
    describeError,
    formatDiagnosticEntry,
} from './diagnosticLog';

describe(createDiagnosticLog.name, () => {
    it('records entries with the time since the log was created', () => {
        let time = 1000;
        const log = createDiagnosticLog({ now: () => time });

        time = 1250;
        log.info('device', 'Initialize', { durationMs: 12 });
        time = 3000;
        log.error('bridge', 'unreachable');

        expect(log.getEntries()).toEqual([
            {
                elapsedMs: 250,
                level: 'info',
                category: 'device',
                message: 'Initialize',
                details: { durationMs: 12 },
            },
            { elapsedMs: 2000, level: 'error', category: 'bridge', message: 'unreachable' },
        ]);
    });

    it('exports a text with the header and one line per entry', () => {
        let time = Date.UTC(2026, 9, 6, 10, 0, 0);
        const log = createDiagnosticLog({
            now: () => time,
            getHeader: () => ({ 'App commit': 'abc123' }),
        });
        time += 1500;
        log.warn('flow', 'step changed', { step: 'device' });

        expect(log.toText()).toBe(
            [
                'App commit: abc123',
                'Log created: 2026-10-06T10:00:00.000Z',
                'Log exported: 2026-10-06T10:00:01.500Z',
                '',
                '+1.500s WARN [flow] step changed {"step":"device"}',
            ].join('\n'),
        );
    });

    it('notifies subscribers and hands React a new snapshot per change', () => {
        const log = createDiagnosticLog();
        const listener = jest.fn();
        log.subscribe(listener);
        const before = log.getEntries();

        log.info('flow', 'first');

        expect(listener).toHaveBeenCalledTimes(1);
        expect(log.getEntries()).not.toBe(before);
        expect(log.getEntries()).toBe(log.getEntries());
    });

    it('drops the oldest entries beyond the limit', () => {
        const log = createDiagnosticLog();
        for (let index = 0; index < MAX_DIAGNOSTIC_ENTRIES + 5; index++) {
            log.info('flow', `entry ${index}`);
        }

        expect(log.getEntries()).toHaveLength(MAX_DIAGNOSTIC_ENTRIES);
        expect(log.getEntries()[0]?.message).toBe('entry 5');
    });

    it('passes every entry to the sink', () => {
        const sink = jest.fn();
        const log = createDiagnosticLog({ sink });

        log.error('device', 'lost');

        expect(sink).toHaveBeenCalledWith(expect.objectContaining({ message: 'lost' }));
    });
});

describe(formatDiagnosticEntry.name, () => {
    it('survives details that cannot be serialized', () => {
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(
            formatDiagnosticEntry({
                elapsedMs: 10,
                level: 'info',
                category: 'x',
                message: 'y',
                details: circular,
            }),
        ).toBe('+0.010s INFO [x] y [details not serializable]');
    });
});

describe(describeError.name, () => {
    it('keeps the name, message and stack of an error', () => {
        expect(describeError(new RangeError('too far'))).toMatchObject({
            name: 'RangeError',
            message: 'too far',
            stack: expect.stringContaining('too far'),
        });
    });

    it('stringifies anything else', () => {
        expect(describeError('plain')).toEqual({ value: 'plain' });
    });
});
