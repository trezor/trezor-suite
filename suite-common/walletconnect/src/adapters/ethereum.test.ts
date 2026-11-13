import { isEthereumChainApproved } from './ethereum';
import { type WalletConnectSession } from '../walletConnectTypes';

const getSession = (chains?: string[]): WalletConnectSession => ({
    topic: 'topic',
    namespaces: chains ? { eip155: { chains } } : {},
    peer: {
        metadata: {
            name: 'dApp',
            url: 'https://example.com',
            icons: [],
        },
    },
});

describe('isEthereumChainApproved', () => {
    it('approves a chain that the session contains', () => {
        expect(isEthereumChainApproved(getSession(['eip155:1', 'eip155:8453']), '0x2105')).toBe(
            true,
        );
    });

    it('rejects a chain that Suite does not support, such as Ronin', () => {
        expect(isEthereumChainApproved(getSession(['eip155:1', 'eip155:8453']), '0x7e4')).toBe(
            false,
        );
    });

    it('rejects any chain when the session has no eip155 namespace', () => {
        expect(isEthereumChainApproved(getSession(), '0x1')).toBe(false);
    });

    it('rejects a chain ID that is not hex', () => {
        expect(isEthereumChainApproved(getSession(['eip155:1']), 'ethereum')).toBe(false);
    });
});
