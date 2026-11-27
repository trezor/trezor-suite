import { MESSAGES } from '@trezor/blockchain-link-types';

import { evmRpcGetChainId } from './evmRpcGetChainId';

const mockSendMessage = jest.fn();

jest.mock('@trezor/blockchain-link', () => ({
    BlockchainLink: jest.fn().mockImplementation(() => ({
        sendMessage: mockSendMessage,
        dispose: jest.fn(),
    })),
}));

const url = 'https://rpc.custom.example';

const mockWorker = ({ getBlockTime }: { getBlockTime: () => Promise<number> }) =>
    mockSendMessage.mockImplementation(({ type }: { type: string }) =>
        type === MESSAGES.GET_EVM_CHAIN_ID ? Promise.resolve(4242) : getBlockTime(),
    );

describe(evmRpcGetChainId.name, () => {
    beforeEach(() => mockSendMessage.mockReset());

    it('asks for the chain id only by default', async () => {
        mockWorker({ getBlockTime: () => Promise.resolve(2.5) });

        await expect(evmRpcGetChainId({ url })).resolves.toEqual({ chainId: 4242 });
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('adds the measured block time when it is requested', async () => {
        mockWorker({ getBlockTime: () => Promise.resolve(2.5) });

        await expect(evmRpcGetChainId({ url, measureBlockTime: true })).resolves.toEqual({
            chainId: 4242,
            blockTimeSeconds: 2.5,
        });
        expect(mockSendMessage).toHaveBeenLastCalledWith({
            type: MESSAGES.GET_EVM_BLOCK_TIME,
            payload: { url },
        });
    });

    it('still returns the chain id when the block time cannot be measured', async () => {
        mockWorker({ getBlockTime: () => Promise.reject(new Error('pruned node')) });

        await expect(evmRpcGetChainId({ url, measureBlockTime: true })).resolves.toEqual({
            chainId: 4242,
            blockTimeSeconds: undefined,
        });
    });

    it('rejects a non-boolean measureBlockTime', async () => {
        await expect(
            evmRpcGetChainId({ url, measureBlockTime: 'yes' as unknown as boolean }),
        ).rejects.toThrow();
    });
});
