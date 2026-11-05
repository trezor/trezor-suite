import { createConsoleLog, startActivity } from './logging';

describe('wardd activity logs', () => {
    it('timestamps console output and correlates requests with timed responses', () => {
        const lines: unknown[][] = [];
        const log = createConsoleLog((...messages) => lines.push(messages));
        const activity = startActivity(log, 'evolu.lookup', { table: 'wardEntry' });
        activity.success({ found: false });

        expect(lines).toHaveLength(2);
        expect(lines[0]?.[0]).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
        expect(lines[1]?.[0]).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
        expect(lines[0]?.[2]).toBe('request');
        expect(lines[1]?.[2]).toBe('response');
        const request = lines[0]?.[3] as Record<string, unknown>;
        const response = lines[1]?.[3] as Record<string, unknown>;
        expect(response).toMatchObject({
            id: request.id,
            operation: 'evolu.lookup',
            outcome: 'ok',
            found: false,
        });
        expect(response.durationMs).toEqual(expect.any(Number));
    });

    it('logs failures without copying exception messages containing wallet data', () => {
        const lines: unknown[][] = [];
        const activity = startActivity((...messages) => lines.push(messages), 'wm.http');
        activity.failure(new Error('private-address'), { status: 503 });
        expect(lines[1]?.[1]).toMatchObject({ outcome: 'error', error: 'Error', status: 503 });
        expect(JSON.stringify(lines)).not.toContain('private-address');
    });
});
