import { renderHook } from '@suite-native/test-utils';
import TrezorConnect from '@trezor/connect';

import { useSubscribeForSolanaBlockUpdates } from './useSubscribeForSolanaBlockUpdates';

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

    it('should subscribe to Solana block updates when Solana account is provided', async () => {
        await renderHook(() =>
            useSubscribeForSolanaBlockUpdates({ symbol: 'sol', networkType: 'solana' }),
        );

        const mockBlockchainSubscribe = TrezorConnect.blockchainSubscribe;

        expect(mockBlockchainSubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });
    });

    it('should not subscribe when non-Solana account is provided', async () => {
        await renderHook(() =>
            useSubscribeForSolanaBlockUpdates({ symbol: 'btc', networkType: 'bitcoin' }),
        );
        const mockBlockchainSubscribe = TrezorConnect.blockchainSubscribe;

        expect(mockBlockchainSubscribe).not.toHaveBeenCalled();
    });

    it('should not subscribe when account is null', async () => {
        await renderHook(() =>
            useSubscribeForSolanaBlockUpdates({ symbol: null, networkType: null }),
        );
        const mockBlockchainSubscribe = TrezorConnect.blockchainSubscribe;

        expect(mockBlockchainSubscribe).not.toHaveBeenCalled();
    });

    it('should unsubscribe when component unmounts with Solana account', async () => {
        const { unmount } = await renderHook(() =>
            useSubscribeForSolanaBlockUpdates({ symbol: 'sol', networkType: 'solana' }),
        );

        const mockBlockchainSubscribe = TrezorConnect.blockchainSubscribe;

        expect(mockBlockchainSubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });

        const mockBlockchainUnsubscribe = TrezorConnect.blockchainUnsubscribe;
        await unmount();

        expect(mockBlockchainUnsubscribe).toHaveBeenCalledWith({
            coin: 'sol',
            blocks: true,
        });
    });
});
