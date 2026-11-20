import type { Account } from '@suite-common/wallet-types';
import { renderHook } from '@suite-native/test-utils';
import { TrezorBlockchain } from '@trezor/blockchain-core';

import { useSubscribeForSolanaBlockUpdates } from './useSubscribeForSolanaBlockUpdates';

jest.mock('@trezor/blockchain-core', () => ({
    TrezorBlockchain: { subscribe: jest.fn(), unsubscribe: jest.fn() },
}));

describe('useSubscribeForSolanaBlockUpdates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should subscribe to Solana block updates when Solana account is provided', async () => {
        const solanaAccount = {
            key: 'sol-account-1',
            symbol: 'sol',
            networkType: 'solana',
        } as unknown as Account;

        await renderHook(() => useSubscribeForSolanaBlockUpdates(solanaAccount));

        const mockBlockchainSubscribe = TrezorBlockchain.subscribe;

        expect(mockBlockchainSubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });
    });

    it('should not subscribe when non-Solana account is provided', async () => {
        const btcAccount = {
            key: 'btc-account-1',
            symbol: 'btc',
            networkType: 'bitcoin',
        } as unknown as Account;

        await renderHook(() => useSubscribeForSolanaBlockUpdates(btcAccount));
        const mockBlockchainSubscribe = TrezorBlockchain.subscribe;

        expect(mockBlockchainSubscribe).not.toHaveBeenCalled();
    });

    it('should not subscribe when account is null', async () => {
        await renderHook(() => useSubscribeForSolanaBlockUpdates(null));
        const mockBlockchainSubscribe = TrezorBlockchain.subscribe;

        expect(mockBlockchainSubscribe).not.toHaveBeenCalled();
    });

    it('should unsubscribe when component unmounts with Solana account', async () => {
        const solanaAccount = {
            key: 'sol-account-1',
            symbol: 'sol',
            networkType: 'solana',
        } as unknown as Account;

        const { unmount } = await renderHook(() =>
            useSubscribeForSolanaBlockUpdates(solanaAccount),
        );

        const mockBlockchainSubscribe = TrezorBlockchain.subscribe;

        expect(mockBlockchainSubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });

        const mockBlockchainUnsubscribe = TrezorBlockchain.unsubscribe;
        await unmount();

        expect(mockBlockchainUnsubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });
    });
});
