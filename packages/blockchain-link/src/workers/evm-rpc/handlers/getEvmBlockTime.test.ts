import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes } from '@trezor/blockchain-link-types';

import { BLOCK_TIME_SAMPLE_SIZE, getAverageBlockTime, getEvmBlockTime } from './getEvmBlockTime';
import type { Request } from '../types';

const mockGetBlock = jest.fn();

jest.mock('viem', () => ({
    ...jest.requireActual('viem'),
    createPublicClient: () => ({ getBlock: mockGetBlock }),
}));

const createRequest = (url = 'https://rpc.custom.example') =>
    ({
        id: 0,
        type: MESSAGES.GET_EVM_BLOCK_TIME,
        payload: { url },
    }) as unknown as Request<MessageTypes.GetEvmBlockTime>;

const mockChain = (blockTimeSeconds: number, latestNumber: bigint) => {
    const timestampOf = (blockNumber: bigint) =>
        BigInt(Math.floor(1_700_000_000 + Number(blockNumber) * blockTimeSeconds));

    mockGetBlock.mockImplementation(({ blockNumber = latestNumber } = {}) =>
        Promise.resolve({ number: blockNumber, timestamp: timestampOf(blockNumber) }),
    );
};

describe(getAverageBlockTime.name, () => {
    it('averages the elapsed time over the blocks in between', () => {
        expect(
            getAverageBlockTime(
                { number: 1500n, timestamp: 2500n },
                { number: 1000n, timestamp: 1500n },
            ),
        ).toBe(2);
    });

    it.each([
        { description: 'no blocks', earlier: { number: 1500n, timestamp: 1500n } },
        { description: 'no elapsed time', earlier: { number: 1000n, timestamp: 2500n } },
    ])('has no block time for $description in the window', ({ earlier }) => {
        expect(getAverageBlockTime({ number: 1500n, timestamp: 2500n }, earlier)).toBeUndefined();
    });
});

describe(getEvmBlockTime.name, () => {
    beforeEach(() => mockGetBlock.mockReset());

    it('measures a sub-second block time over the sample window', async () => {
        mockChain(0.5, 1_000_000n);

        const response = await getEvmBlockTime(createRequest());

        expect(response).toEqual({ type: RESPONSES.GET_EVM_BLOCK_TIME, payload: 0.5 });
        expect(mockGetBlock).toHaveBeenLastCalledWith({
            blockNumber: 1_000_000n - BLOCK_TIME_SAMPLE_SIZE,
        });
    });

    it('shrinks the window to the genesis block on a young chain', async () => {
        mockChain(12, 10n);

        const response = await getEvmBlockTime(createRequest());

        expect(response.payload).toBe(12);
        expect(mockGetBlock).toHaveBeenLastCalledWith({ blockNumber: 0n });
    });

    it('fails when the chain has no block to measure against', async () => {
        mockChain(12, 0n);

        await expect(getEvmBlockTime(createRequest())).rejects.toThrow('could not be measured');
    });

    it('rejects an unsupported URL', async () => {
        await expect(getEvmBlockTime(createRequest('ftp://rpc.custom.example'))).rejects.toThrow(
            'Invalid URL',
        );
    });
});
