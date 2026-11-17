import { MESSAGES } from '@trezor/blockchain-link-types';

import BlockchainEvmRpcGetChainId from './blockchainEvmRpcGetChainId';
import type { MethodMessage } from '../core/AbstractMethod';

const mockSendMessage = jest.fn();

jest.mock('@trezor/blockchain-link', () => ({
    BlockchainLink: jest.fn().mockImplementation(() => ({
        sendMessage: mockSendMessage,
        dispose: jest.fn(),
    })),
}));

const createMethod = (payload: object = {}) =>
    new BlockchainEvmRpcGetChainId({
        payload: {
            method: 'blockchainEvmRpcGetChainId',
            url: 'https://rpc.custom.example',
            ...payload,
        },
    } as MethodMessage<'blockchainEvmRpcGetChainId'>);

const mockWorker = ({ getBlockTime }: { getBlockTime: () => Promise<number> }) =>
    mockSendMessage.mockImplementation(({ type }: { type: string }) =>
        type === MESSAGES.GET_EVM_CHAIN_ID ? Promise.resolve(4242) : getBlockTime(),
    );

describe('BlockchainEvmRpcGetChainId', () => {
    beforeEach(() => mockSendMessage.mockReset());

    it('asks for the chain id only by default', async () => {
        mockWorker({ getBlockTime: () => Promise.resolve(2.5) });

        await expect(createMethod().run()).resolves.toEqual({ chainId: 4242 });
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('adds the measured block time when it is requested', async () => {
        mockWorker({ getBlockTime: () => Promise.resolve(2.5) });

        await expect(createMethod({ measureBlockTime: true }).run()).resolves.toEqual({
            chainId: 4242,
            blockTimeSeconds: 2.5,
        });
        expect(mockSendMessage).toHaveBeenLastCalledWith({
            type: MESSAGES.GET_EVM_BLOCK_TIME,
            payload: { url: 'https://rpc.custom.example' },
        });
    });

    it('still returns the chain id when the block time cannot be measured', async () => {
        mockWorker({ getBlockTime: () => Promise.reject(new Error('pruned node')) });

        const result = await createMethod({ measureBlockTime: true }).run();

        expect(result.chainId).toBe(4242);
        expect(result.blockTimeSeconds).toBeUndefined();
    });

    it('rejects a non-boolean measureBlockTime', () => {
        expect(() => createMethod({ measureBlockTime: 'yes' })).toThrow();
    });
});
