import type { PortfolioAccount } from '@suite-common/chain-data';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';

import { addRuntimeEvmChainAccounts } from './addRuntimeEvmChainAccounts';

const definition = (symbol: string, chainId: number): RuntimeEvmNetworkDefinition => ({
    symbol: asNetworkSymbol(symbol),
    chainId,
    name: symbol,
    nativeSymbol: symbol.toUpperCase(),
    decimals: 18,
    rpcUrls: ['https://rpc.example.com'],
    source: 'user',
});

const ethAccount: PortfolioAccount = {
    id: 'eth-0x1-state',
    chainAccounts: [
        {
            symbol: asNetworkSymbol('eth'),
            descriptor: '0x1',
            accountType: 'normal',
            connectionIdentity: 'state',
            watchedTokens: ['0xtoken'],
        },
    ],
};

const btcAccount: PortfolioAccount = {
    id: 'btc-zpub-state',
    chainAccounts: [{ symbol: asNetworkSymbol('btc'), descriptor: 'zpub', accountType: 'normal' }],
};

describe(addRuntimeEvmChainAccounts.name, () => {
    it("reads each runtime network at every Ethereum account's address", () => {
        const [eth, btc] = addRuntimeEvmChainAccounts(
            [ethAccount, btcAccount],
            [definition('abc', 1001), definition('xyz', 1002)],
        );

        expect(eth?.chainAccounts).toEqual([
            ethAccount.chainAccounts[0],
            {
                symbol: 'abc',
                descriptor: '0x1',
                accountType: 'normal',
                connectionIdentity: 'state',
            },
            {
                symbol: 'xyz',
                descriptor: '0x1',
                accountType: 'normal',
                connectionIdentity: 'state',
            },
        ]);
        expect(btc).toBe(btcAccount);
    });

    it('keeps the accounts as they are without runtime networks', () => {
        const accounts = [ethAccount];

        expect(addRuntimeEvmChainAccounts(accounts, [])).toBe(accounts);
    });
});
