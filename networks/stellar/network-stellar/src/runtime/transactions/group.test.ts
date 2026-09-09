import { groupOperationsByTransaction } from './group';

const operation = (transactionHash: string, pagingToken: string) =>
    ({
        id: pagingToken,
        transaction_hash: transactionHash,
        paging_token: pagingToken,
    }) as Parameters<typeof groupOperationsByTransaction>[0][number];

type EffectRecord =
    NonNullable<Parameters<typeof groupOperationsByTransaction>[2]> extends ReadonlyMap<
        string,
        (infer T)[]
    >
        ? T
        : never;

const effect = (operationId: string, index: number) =>
    ({
        id: `${operationId}-${index}`,
        paging_token: `${operationId}-${index}`,
        type: 'account_credited',
    }) as EffectRecord;

describe('groupOperationsByTransaction', () => {
    it('returns nothing for an empty response', () => {
        expect(groupOperationsByTransaction([], false)).toEqual([]);
    });

    it('groups the operations of one transaction and keeps the last cursor', () => {
        const groups = groupOperationsByTransaction(
            [operation('tx1', '30'), operation('tx1', '20'), operation('tx1', '10')],
            false,
        );

        expect(groups).toHaveLength(1);
        expect(groups[0]?.transactionHash).toBe('tx1');
        expect(groups[0]?.operations).toHaveLength(3);
        expect(groups[0]?.cursor).toBe('10');
    });

    it('starts a new group for each transaction', () => {
        const groups = groupOperationsByTransaction(
            [operation('tx1', '30'), operation('tx2', '20'), operation('tx2', '10')],
            false,
        );

        expect(groups.map(group => [group.transactionHash, group.cursor])).toEqual([
            ['tx1', '30'],
            ['tx2', '10'],
        ]);
    });

    it('drops the trailing group when the window was full, since it may be cut in half', () => {
        const groups = groupOperationsByTransaction(
            [operation('tx1', '30'), operation('tx2', '20'), operation('tx2', '10')],
            true,
        );

        expect(groups.map(group => group.transactionHash)).toEqual(['tx1']);
    });

    it('returns nothing when a full window holds a single transaction, so the caller can widen it', () => {
        const groups = groupOperationsByTransaction(
            [operation('tx1', '20'), operation('tx1', '10')],
            true,
        );

        expect(groups).toEqual([]);
    });

    it('treats a transaction hash that reappears out of order as a separate group', () => {
        // Horizon orders by TOID, so operations of one transaction are always adjacent
        const groups = groupOperationsByTransaction(
            [operation('tx1', '30'), operation('tx2', '20'), operation('tx1', '10')],
            false,
        );

        expect(groups.map(group => group.transactionHash)).toEqual(['tx1', 'tx2', 'tx1']);
    });

    it('gives each group the effects of its own operations', () => {
        const groups = groupOperationsByTransaction(
            [operation('tx1', '30'), operation('tx2', '20'), operation('tx2', '10')],
            false,
            new Map([
                ['30', [effect('30', 1)]],
                ['20', [effect('20', 1)]],
                ['10', [effect('10', 1), effect('10', 2)]],
            ]),
        );

        expect(groups[0]?.effects.map(({ id }) => id)).toEqual(['30-1']);
        // A multi-operation transaction nets the effects of all of them
        expect(groups[1]?.effects.map(({ id }) => id)).toEqual(['20-1', '10-1', '10-2']);
    });

    it('leaves the effects empty when none were read', () => {
        const groups = groupOperationsByTransaction([operation('tx1', '30')], false);

        expect(groups[0]?.effects).toEqual([]);
    });
});
