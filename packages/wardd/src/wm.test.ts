import { ed25519 } from '@noble/curves/ed25519.js';
import { hexToBytes } from '@noble/hashes/utils.js';
import { createServer } from 'http';
import { type AddressInfo } from 'net';

import { EMPTY_PART, type WardLeafBlob } from '@trezor/ward';
import { DEBUG_QM_SEED } from '@trezor/ward/src/mocks';

import { finalizationMessage } from './transition';
import { HttpWm, MockWm, WmConflict } from './wm';
import { mockTransition } from '../mocks/mockTransition';

it('sends only compact leaf changes when WM recovery is enabled', async () => {
    const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(() => Promise.resolve(Response.json({ signature: 'final-signature' })));
    try {
        const transition = mockTransition();
        const leaves: WardLeafBlob[] = [
            {
                entryKey: 'aa'.repeat(32),
                keyType: 'address',
                identity: EMPTY_PART,
                content: { ...EMPTY_PART, bodyHex: '01' },
            },
            {
                entryKey: 'bb'.repeat(32),
                keyType: 'address',
                identity: EMPTY_PART,
                content: EMPTY_PART,
            },
        ];
        const client = new HttpWm('http://wm.example', undefined, false, true);
        expect(await client.commit(transition, leaves)).toBe('final-signature');
        const requestBody = fetchMock.mock.calls[0]?.[1]?.body;
        if (typeof requestBody !== 'string') throw new Error('Expected a JSON request');
        expect(JSON.parse(requestBody)).toEqual({
            transition,
            recoveryLeaves: [
                {
                    entryKey: leaves[0]?.entryKey,
                    valueDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
                },
                { entryKey: leaves[1]?.entryKey, valueDigest: null },
            ],
        });
    } finally {
        fetchMock.mockRestore();
    }
});

describe('WM call logging', () => {
    it('logs the returned head and HTTP status without request payloads or signatures', async () => {
        const lines: unknown[][] = [];
        const transition = mockTransition({ mac: 'aa'.repeat(32) });
        const conflicting = mockTransition({
            fromCounter: 1,
            fromRoot: transition.root,
            counter: 2,
            root: 'bb'.repeat(32),
            mac: 'cc'.repeat(32),
        });
        let status = 200;
        const server = createServer((_request, response) => {
            response.writeHead(status, { 'content-type': 'application/json' });
            response.end(
                JSON.stringify(
                    status === 200
                        ? {
                              wardId: transition.wardId,
                              transition,
                              nonce: 'private-nonce',
                              timestamp: 1700000000,
                              signature: 'private-signature',
                          }
                        : {
                              error: 'checkpoint_conflict',
                              wardId: transition.wardId,
                              transition: conflicting,
                          },
                ),
            );
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        try {
            const client = new HttpWm(
                `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
                (...messages) => lines.push(messages),
            );
            expect(await client.current(transition.wardId, 'private-nonce')).toMatchObject({
                counter: 1,
                signature: 'private-signature',
            });
            status = 409;
            await expect(client.commit(mockTransition())).rejects.toBeInstanceOf(WmConflict);
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
                    ['wm.head', { source: 'HTTP response', counter: 1, mac: 'aa'.repeat(32) }],
                    [
                        'wm.head',
                        {
                            source: 'HTTP 409',
                            error: 'checkpoint_conflict',
                            counter: 2,
                            mac: 'cc'.repeat(32),
                        },
                    ],
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
        await client.commit(mockTransition());
        expect(lines[0]?.[1]).toMatchObject({ operation: 'wm.mock.commit', counter: 1 });
        expect(lines[1]?.[1]).toMatchObject({ outcome: 'ok' });
    });
});

describe('WM HTTP API', () => {
    const serve = (...responses: Response[]) =>
        jest
            .spyOn(globalThis, 'fetch')
            .mockImplementation(() => Promise.resolve(responses.shift() ?? Response.error()));
    const sentBody = (fetchMock: jest.SpyInstance, call = 0) =>
        JSON.parse(fetchMock.mock.calls[call]?.[1]?.body as string);

    afterEach(() => jest.restoreAllMocks());

    it('derives the genesis head from an attestation without a transition', async () => {
        const { wardId } = mockTransition();
        const fetchMock = serve(
            Response.json({ wardId, nonce: 'cd'.repeat(32), timestamp: 7, signature: 'sig' }),
        );
        const head = await new HttpWm('http://wm.example').current(wardId, 'cd'.repeat(32));
        expect(sentBody(fetchMock)).toEqual({ wardId, nonce: 'cd'.repeat(32) });
        expect(head).toEqual({ counter: 0, root: '', timestamp: 7, signature: 'sig' });
    });

    it('derives the head from the latest accepted transition', async () => {
        const transition = mockTransition();
        serve(
            Response.json({
                wardId: transition.wardId,
                transition,
                nonce: 'cd'.repeat(32),
                timestamp: 7,
                signature: 'sig',
            }),
        );
        const head = await new HttpWm('http://wm.example').current(
            transition.wardId,
            'cd'.repeat(32),
        );
        expect(head).toEqual({
            counter: 1,
            root: transition.root,
            mac: transition.mac,
            timestamp: 7,
            signature: 'sig',
            transition,
        });
    });

    it('rejects an attested transition the wallet did not sign', async () => {
        const transition = { ...mockTransition(), mac: '22'.repeat(32) };
        serve(
            Response.json({
                wardId: transition.wardId,
                transition,
                nonce: 'cd'.repeat(32),
                timestamp: 7,
                signature: 'sig',
            }),
        );
        await expect(
            new HttpWm('http://wm.example').current(transition.wardId, 'cd'.repeat(32)),
        ).rejects.toThrow('invalid wallet transition signature');
    });

    it('nests the transition in a commit and returns the finalization signature', async () => {
        const transition = mockTransition();
        const fetchMock = serve(
            Response.json({ wardId: transition.wardId, transition, signature: 'final' }),
        );
        expect(await new HttpWm('http://wm.example').commit(transition)).toBe('final');
        expect(sentBody(fetchMock)).toEqual({ transition });
    });

    it.each([
        ['checkpoint_conflict', true],
        ['recovery_batch_conflict', false],
    ])('maps a 409 %s to the returned head', async (error, withTransition) => {
        const head = mockTransition({ mac: '44'.repeat(32) });
        serve(
            Response.json(
                { error, wardId: head.wardId, ...(withTransition && { transition: head }) },
                { status: 409 },
            ),
        );
        const conflict = await new HttpWm('http://wm.example')
            .commit(mockTransition())
            .catch(e => e);
        expect(conflict).toBeInstanceOf(WmConflict);
        expect(conflict).toMatchObject(
            withTransition ? { counter: 1, mac: '44'.repeat(32) } : { counter: 0, mac: undefined },
        );
    });

    it('reads the verified history, oldest first', async () => {
        const one = mockTransition();
        const two = mockTransition({
            fromCounter: 1,
            fromRoot: one.root,
            counter: 2,
            root: 'bb'.repeat(32),
        });
        const fetchMock = serve(Response.json({ wardId: one.wardId, transitions: [one, two] }));
        expect(await new HttpWm('http://wm.example/').history(one.wardId)).toEqual([one, two]);
        expect(fetchMock.mock.calls[0]?.[0]).toBe(`http://wm.example/ward/${one.wardId}/history`);
    });
});

describe('MockWm', () => {
    it('attests genesis, then the accepted transition, and replays an exact retry', async () => {
        const wm = new MockWm();
        const one = mockTransition();
        const genesis = await wm.current(one.wardId, 'cd'.repeat(32));
        expect(genesis).toMatchObject({ counter: 0, root: '' });
        expect(genesis.transition).toBeUndefined();

        const final = await wm.commit(one);
        // The finalization signs the accepted transition, not just its counter and mac.
        expect(
            ed25519.verify(
                hexToBytes(final),
                finalizationMessage(one),
                ed25519.getPublicKey(DEBUG_QM_SEED),
            ),
        ).toBe(true);
        expect(await wm.commit(one)).toBe(final);
        await expect(wm.commit(mockTransition({ mac: '22'.repeat(32) }))).rejects.toMatchObject({
            counter: 1,
            mac: one.mac,
        });
        expect(await wm.current(one.wardId, 'cd'.repeat(32))).toMatchObject({
            counter: 1,
            root: one.root,
            mac: one.mac,
            transition: one,
        });
        expect(await wm.history(one.wardId)).toEqual([one]);
    });
});
