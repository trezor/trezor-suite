import { type WalletConnectSession } from './walletConnectTypes';
import { getSessionNetworks } from './walletConnectUtils';

const mockWalletConnectSession = (
    namespaces: WalletConnectSession['namespaces'],
): WalletConnectSession => ({
    topic: 'topic',
    namespaces,
    peer: { metadata: { name: 'dApp', url: 'https://dapp.example', icons: [] } },
});

const getSessionSymbols = (namespaces: WalletConnectSession['namespaces']) =>
    getSessionNetworks(mockWalletConnectSession(namespaces)).map(network => network.symbol);

describe(getSessionNetworks.name, () => {
    it('finds Ethereum networks by chain ID, including those without a CAIP ID', () => {
        const symbols = getSessionSymbols({
            eip155: {
                chains: [
                    'eip155:1',
                    'eip155:61',
                    'eip155:11155111',
                    'eip155:560048',
                    'eip155:5042002',
                ],
            },
        });

        expect(symbols).toEqual(['eth', 'etc', 'tsep', 'thod', 'tarc']);
    });

    it('finds other networks by CAIP ID', () => {
        const symbols = getSessionSymbols({
            bip122: { chains: ['bip122:000000000019d6689c085ae165831e93'] },
            solana: { chains: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'] },
        });

        expect(symbols).toEqual(['btc', 'sol']);
    });

    it('skips chains of unknown networks', () => {
        const symbols = getSessionSymbols({
            eip155: { chains: ['eip155:424242', 'eip155:1'] },
            bip122: { chains: ['bip122:unknown'] },
        });

        expect(symbols).toEqual(['eth']);
    });
});
