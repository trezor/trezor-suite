import { type ChainAsset } from '@suite-common/chain-data';
import { type TokenDefinition } from '@suite-common/token-definitions';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

import { filterShownChainTokens } from './filterShownChainTokens';
import { groupChainAssetsByNetwork } from './groupChainAssetsByNetwork';

const eth = asNetworkSymbol('eth');
const base = asNetworkSymbol('base');

const native = (
    accountId: string,
    symbol: NetworkSymbol,
    amount: string,
    fiatValue: string | null,
): ChainAsset => ({
    accountId,
    ref: { symbol, descriptor: accountId, accountType: 'normal' },
    kind: 'native',
    symbol: 'ETH',
    amount,
    fiatValue,
});

const token = (
    accountId: string,
    symbol: NetworkSymbol,
    contract: string,
    amount: string,
    fiatValue: string | null,
): ChainAsset => ({
    accountId,
    ref: { symbol, descriptor: accountId, accountType: 'normal' },
    kind: 'token',
    contract,
    standard: 'ERC20',
    decimals: 18,
    symbol: contract.toUpperCase(),
    amount,
    fiatValue,
});

const assets = [
    native('a1', eth, '1', '3000'),
    token('a1', eth, 'weth', '0.5', '1500'),
    token('a1', eth, 'spam', '1000', null),
    native('a2', eth, '0.5', '1500'),
    token('a2', eth, 'weth', '0.25', '750'),
    token('a2', eth, 'hidden', '1', '1'),
    native('a3', base, '2', '6000'),
    token('a3', base, 'weth', '0.1', null),
];

const definitions: Record<string, TokenDefinition> = {
    eth: { error: false, isLoading: false, data: ['weth', 'hidden'], hide: ['hidden'], show: [] },
    base: { error: false, isLoading: false, data: ['weth'], hide: [], show: [] },
};

describe('chain assets on the dashboard', () => {
    it('keeps native assets and the tokens shown today', () => {
        const shown = filterShownChainTokens(assets, symbol => definitions[symbol]);

        expect(shown.map(({ ref, kind, contract }) => [ref.descriptor, kind, contract])).toEqual([
            ['a1', 'native', undefined],
            ['a1', 'token', 'weth'],
            ['a2', 'native', undefined],
            ['a2', 'token', 'weth'],
            ['a3', 'native', undefined],
            ['a3', 'token', 'weth'],
        ]);
    });

    it('sums per network and never merges across networks', () => {
        const groups = groupChainAssetsByNetwork(
            filterShownChainTokens(assets, symbol => definitions[symbol]),
        );

        expect(groups).toEqual([
            {
                symbol: 'eth',
                native: expect.objectContaining({ amount: '1.5', fiatValue: '4500' }),
                tokens: [
                    expect.objectContaining({
                        contract: 'weth',
                        amount: '0.75',
                        fiatValue: '2250',
                    }),
                ],
            },
            {
                symbol: 'base',
                native: expect.objectContaining({ amount: '2', fiatValue: '6000' }),
                tokens: [
                    expect.objectContaining({ contract: 'weth', amount: '0.1', fiatValue: null }),
                ],
            },
        ]);
    });
});
