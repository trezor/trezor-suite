import { groupOperationsByTransaction } from './group';

const operation = (transactionHash: string, pagingToken: string) =>
    ({
        transaction_hash: transactionHash,
        paging_token: pagingToken,
    }) as Parameters<typeof groupOperationsByTransaction>[0][number];

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
});
