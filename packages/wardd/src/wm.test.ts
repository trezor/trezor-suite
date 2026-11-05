import { createServer } from 'http';
import { type AddressInfo } from 'net';

import { HttpWm, MockWm, WmConflict } from './wm';

describe('WM call logging', () => {
    it('logs the returned head and HTTP status without request payloads or signatures', async () => {
        const lines: unknown[][] = [];
        let status = 200;
        const server = createServer((_request, response) => {
            response.writeHead(status, { 'content-type': 'application/json' });
            response.end(
                JSON.stringify(
                    status === 200
                        ? { signature: 'private-signature', counter: 1, mac: '11'.repeat(32) }
                        : { counter: 2 },
                ),
            );
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
            const client = new HttpWm(
                `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
                (...messages) => lines.push(messages),
            );
            expect(
                await client.attest({
                    wardId: 'private-ward',
                    nonce: 'private-nonce',
                    counter: 1,
                    mac: 'private-mac',
                }),
            ).toBe('private-signature');
            status = 409;
            await expect(
                client.commit({ wardId: 'private-ward', counter: 1 }),
            ).rejects.toBeInstanceOf(WmConflict);
            expect(lines.filter(line => line[0] === 'response')[0]?.[1]).toMatchObject({
                operation: 'wm.http',
                status: 200,
                outcome: 'ok',
            });
            expect(lines.filter(line => line[0] === 'response').at(-1)?.[1]).toMatchObject({
                operation: 'wm.http',
                status: 409,
                outcome: 'error',
            });
            expect(lines).toEqual(
                expect.arrayContaining([
                    ['wm.head', { source: 'HTTP response', counter: 1, mac: '11'.repeat(32) }],
                    ['wm.head', { source: 'HTTP 409', counter: 2, mac: 'EMPTY' }],
                ]),
            );
            expect(JSON.stringify(lines)).not.toContain('private-');
        } finally {
            await new Promise<void>((resolve, reject) =>
                server.close(error => (error ? reject(error) : resolve())),
            );
        }
    });

    it('also logs calls to the in-process debug manager', async () => {
        const lines: unknown[][] = [];
        const client = new MockWm((...messages) => lines.push(messages));
        await client.commit({ wardId: 'cd'.repeat(32), counter: 1 });
        expect(lines[0]?.[1]).toMatchObject({ operation: 'wm.mock.commit', counter: 1 });
        expect(lines[1]?.[1]).toMatchObject({ outcome: 'ok' });
    });
});
