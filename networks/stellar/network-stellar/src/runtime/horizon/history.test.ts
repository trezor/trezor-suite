import { readAccountHistory } from './history';
import { STELLAR_HISTORY_EFFECTS_LIMIT, STELLAR_HISTORY_PAGE_TIMEOUT_MS } from '../../constants';
import type { StellarHorizonServer } from '../../types';

const DESCRIPTOR = 'GBSXTBPFJOJ64NSYRFE2F6P6TPMMSD45KQZH5TEWIBEAHICY6IZVGCET';

const operation = (id: string, transactionHash = `tx-${id}`) => ({
    id,
    paging_token: id,
    transaction_hash: transactionHash,
    type: 'payment',
});

const effect = (operationId: string, index: number) => ({
    id: `${operationId}-${index}`,
    paging_token: `${operationId}-${index}`,
    account: DESCRIPTOR,
    type: 'account_credited',
    asset_type: 'native',
    amount: '1.0000000',
});

type HorizonStub = {
    operationCursors: (string | undefined)[];
    effectCursors: (string | undefined)[];
    operationRecords: ReturnType<typeof operation>[];
    effectWindows: ReturnType<typeof effect>[][];
    effectsError?: unknown;
    operationsHang?: boolean;
    horizon: StellarHorizonServer;
};

const createHorizonStub = (): HorizonStub => {
    const stub: HorizonStub = {
        operationCursors: [],
        effectCursors: [],
        operationRecords: [],
        effectWindows: [],
        horizon: {
            operations: () => {
                let cursor: string | undefined;
                const builder = {
                    forAccount: () => builder,
                    includeFailed: () => builder,
                    join: () => builder,
                    limit: () => builder,
                    order: () => builder,
                    cursor: (value: string) => {
                        cursor = value;

                        return builder;
                    },
                    call: () => {
                        stub.operationCursors.push(cursor);

                        if (stub.operationsHang) return new Promise(() => {});

                        return Promise.resolve({ records: stub.operationRecords });
                    },
                };

                return builder;
            },
            effects: () => {
                let cursor: string | undefined;
                const builder = {
                    forAccount: () => builder,
                    limit: () => builder,
                    order: () => builder,
                    cursor: (value: string) => {
                        cursor = value;

                        return builder;
                    },
                    call: () => {
                        if (stub.effectsError) throw stub.effectsError;

                        stub.effectCursors.push(cursor);

                        return Promise.resolve({
                            records: stub.effectWindows[stub.effectCursors.length - 1] ?? [],
                        });
                    },
                };

                return builder;
            },
        } as unknown as StellarHorizonServer,
    };

    return stub;
};

const read = (stub: HorizonStub, cursor?: string) =>
    readAccountHistory({ horizon: stub.horizon, descriptor: DESCRIPTOR, pageSize: 2, cursor });

describe(readAccountHistory.name, () => {
    it('reads the effects of the window alongside its operations', async () => {
        const stub = createHorizonStub();
        stub.operationRecords = [operation('30'), operation('20')];
        stub.effectWindows = [[effect('30', 1), effect('20', 1), effect('20', 2)]];

        const groups = await read(stub);

        expect(stub.effectCursors).toEqual([undefined]);
        expect(groups.map(({ effects }) => effects.length)).toEqual([1, 2]);
    });

    it('starts the effects window just below the operation the page continues from', async () => {
        const stub = createHorizonStub();
        stub.operationRecords = [operation('20')];

        await read(stub, '30');

        expect(stub.effectCursors).toEqual(['30-0']);
    });

    it('keeps the history when the effects request fails', async () => {
        const stub = createHorizonStub();
        stub.operationRecords = [operation('30')];
        stub.effectsError = new Error('Horizon is having a moment');

        const groups = await read(stub);

        expect(groups).toHaveLength(1);
        expect(groups[0]?.effects).toEqual([]);
    });

    it('chases one more effects window when the first did not reach the oldest operation', async () => {
        const stub = createHorizonStub();
        stub.operationRecords = [operation('30'), operation('10')];
        stub.effectWindows = [
            Array.from({ length: STELLAR_HISTORY_EFFECTS_LIMIT }, (_, index) =>
                effect('30', index + 1),
            ),
            [effect('10', 1)],
        ];

        const groups = await read(stub);

        expect(stub.effectCursors).toEqual([undefined, `30-${STELLAR_HISTORY_EFFECTS_LIMIT}`]);
        expect(groups[1]?.effects.map(({ id }) => id)).toEqual(['10-1']);
    });

    it('leaves an operation the effects never reached to be described by itself', async () => {
        const stub = createHorizonStub();
        stub.operationRecords = [operation('30'), operation('10')];
        stub.effectWindows = [
            Array.from({ length: STELLAR_HISTORY_EFFECTS_LIMIT }, (_, index) =>
                effect('30', index + 1),
            ),
            Array.from({ length: STELLAR_HISTORY_EFFECTS_LIMIT }, (_, index) =>
                effect('20', index + 1),
            ),
        ];

        const groups = await read(stub);

        expect(stub.effectCursors).toHaveLength(2);
        expect(groups[1]?.effects).toEqual([]);
    });

    it('skips the effects request when the enrichment is off', async () => {
        const stub = createHorizonStub();
        stub.operationRecords = [operation('30')];

        const groups = await readAccountHistory(
            { horizon: stub.horizon, descriptor: DESCRIPTOR, pageSize: 2 },
            'off',
        );

        expect(stub.effectCursors).toEqual([]);
        expect(groups[0]?.effects).toEqual([]);
    });

    it('gives up on a Horizon read that never answers, rather than returning a short page', async () => {
        jest.useFakeTimers();
        const stub = createHorizonStub();
        stub.operationsHang = true;

        const settled = read(stub).catch((error: Error) => error.message);

        await jest.advanceTimersByTimeAsync(STELLAR_HISTORY_PAGE_TIMEOUT_MS + 1);

        await expect(settled).resolves.toBe('Aborted by timeout');

        jest.useRealTimers();
    });
});
