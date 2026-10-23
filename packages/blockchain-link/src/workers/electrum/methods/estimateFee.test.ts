import estimateFee from './estimateFee';

const makeClient = (feeByBlocks: Record<number, string>) => ({
    request: jest.fn((method: string, num: number) => {
        expect(method).toBe('blockchain.estimatefee');

        return Promise.resolve(feeByBlocks[num]);
    }),
});

describe('electrum estimateFee', () => {
    it('estimates fee for each explicitly requested block target', async () => {
        const client = makeClient({ 1: '0.00001000', 6: '0.00000500' });
        const result = await estimateFee({ client } as any, { blocks: [1, 6] });

        expect(client.request).toHaveBeenCalledTimes(2);
        expect(result).toEqual([{ feePerUnit: '1000' }, { feePerUnit: '500' }]);
    });

    // blockchainEstimateFee (packages/connect/src/api/blockchainEstimateFee.ts) allows a caller to omit
    // `request.blocks` entirely (`backend.estimateFee(request || {})`), bypassing the "smart" fee-levels
    // loader that always supplies an explicit `blocks` array. Before this fix, an absent/empty `blocks`
    // silently produced `[]` (no fee data, no error) instead of a usable fallback.
    it('falls back to a single default block target when blocks is absent', async () => {
        const client = makeClient({ 2: '0.00000800' });
        const result = await estimateFee({ client } as any, {});

        expect(client.request).toHaveBeenCalledTimes(1);
        expect(result).toEqual([{ feePerUnit: '800' }]);
    });

    it('falls back to the default block target when blocks is an empty array', async () => {
        const client = makeClient({ 2: '0.00000800' });
        const result = await estimateFee({ client } as any, { blocks: [] });

        expect(client.request).toHaveBeenCalledTimes(1);
        expect(result).toEqual([{ feePerUnit: '800' }]);
    });
});
