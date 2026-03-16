import { type Account } from '@suite-common/wallet-types';
import { renderHook } from '@suite-native/test-utils';
import TrezorConnect from '@trezor/connect';

import { useSubscribeForSolanaBlockUpdates } from '../useSubscribeForSolanaBlockUpdates';

// Mock TrezorConnect
jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    blockchainSubscribe: jest.fn(),
    blockchainUnsubscribe: jest.fn(),
}));

describe('useSubscribeForSolanaBlockUpdates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should subscribe to Solana block updates when Solana account is provided', () => {
        const solanaAccount = {
            key: 'sol-account-1',
            symbol: 'sol',
            networkType: 'solana',
        } as unknown as Account;

        renderHook(() => useSubscribeForSolanaBlockUpdates(solanaAccount));

        const mockBlockchainSubscribe = TrezorConnect.blockchainSubscribe;

        expect(mockBlockchainSubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });
    });

    it('should not subscribe when non-Solana account is provided', () => {
        const btcAccount = {
            key: 'btc-account-1',
            symbol: 'btc',
            networkType: 'bitcoin',
        } as unknown as Account;

        renderHook(() => useSubscribeForSolanaBlockUpdates(btcAccount));
        const mockBlockchainSubscribe = TrezorConnect.blockchainSubscribe;

        expect(mockBlockchainSubscribe).not.toHaveBeenCalled();
    });

    it('should not subscribe when account is null', () => {
        renderHook(() => useSubscribeForSolanaBlockUpdates(null));
        const mockBlockchainSubscribe = TrezorConnect.blockchainSubscribe;

        expect(mockBlockchainSubscribe).not.toHaveBeenCalled();
    });

    it('should unsubscribe when component unmounts with Solana account', () => {
        const solanaAccount = {
            key: 'sol-account-1',
            symbol: 'sol',
            networkType: 'solana',
        } as unknown as Account;

        const { unmount } = renderHook(() => useSubscribeForSolanaBlockUpdates(solanaAccount));

        const mockBlockchainSubscribe = TrezorConnect.blockchainSubscribe;

        expect(mockBlockchainSubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });

        const mockBlockchainUnsubscribe = TrezorConnect.blockchainUnsubscribe;
        unmount();

        expect(mockBlockchainUnsubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });
    });
});
