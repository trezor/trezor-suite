/**
 * @jest-environment jsdom
 */
import { renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';
import type { ChainNetwork } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import type { PortfolioAccount } from './PortfolioAccount';
import { useChainAssets } from './useChainAssets';
import { createFakeChainNetwork } from '../mocks/createFakeChainNetwork';

const token = (contract: string, symbol: string, balance: string) => ({
    standard: 'ERC20' as const,
    contract,
    symbol,
    decimals: 18,
    balance,
});

const btc = createFakeChainNetwork({
    symbol: asNetworkSymbol('btc'),
    balances: { zpub: '1.49' },
    rate: { rate: 60000, timestamp: 1 },
});
const eth = createFakeChainNetwork({
    symbol: asNetworkSymbol('eth'),
    balances: { '0xabc': '0.42069' },
    rate: { rate: 3000, timestamp: 1 },
    tokens: { '0xabc': [token('0xweth', 'WETH', '0.3333'), token('0xwbtc', 'WBTC', '0.555')] },
    tokenRates: { '0xweth': { rate: 3000, timestamp: 1 } },
});
const base = createFakeChainNetwork({
    symbol: asNetworkSymbol('base'),
    nativeSymbol: 'ETH',
    balances: { '0xabc': '0.8453' },
    rate: { rate: 3000, timestamp: 1 },
    tokens: { '0xabc': [token('0xbaseweth', 'WETH', '0.1111')] },
});

const btcAccount: PortfolioAccount = {
    id: 'btc',
    chainAccounts: [{ symbol: asNetworkSymbol('btc'), descriptor: 'zpub', accountType: 'normal' }],
};

// One EVM address used on Ethereum and Base: one user-facing account, two chain accounts.
const evmAccount: PortfolioAccount = {
    id: 'evm',
    chainAccounts: [
        { symbol: asNetworkSymbol('eth'), descriptor: '0xabc', accountType: 'normal' },
        { symbol: asNetworkSymbol('base'), descriptor: '0xabc', accountType: 'normal' },
    ],
};

const renderAssets = (
    networks: readonly ChainNetwork[],
    accounts: readonly PortfolioAccount[],
    enabled = true,
) =>
    renderHookWithQueryClient(() =>
        useChainAssets({ networks, accounts, currency: 'usd', enabled }),
    );

const summarize = (assets: ReturnType<typeof useChainAssets>['assets']) =>
    assets.map(({ ref, kind, symbol, amount, fiatValue }) => [
        ref.symbol,
        kind,
        symbol,
        amount,
        fiatValue,
    ]);

describe('useChainAssets', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('lists every native coin and token per chain account, unmerged', async () => {
        const { result } = renderAssets(
            [btc.network, eth.network, base.network],
            [btcAccount, evmAccount],
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(summarize(result.current.assets)).toEqual([
            ['btc', 'native', 'BTC', '1.49', '89400'],
            ['eth', 'native', 'ETH', '0.42069', '1262.07'],
            ['eth', 'token', 'WETH', '0.3333', '999.9'],
            ['eth', 'token', 'WBTC', '0.555', null],
            ['base', 'native', 'ETH', '0.8453', '2535.9'],
            ['base', 'token', 'WETH', '0.1111', null],
        ]);
        expect(result.current.assets.map(({ accountId }) => accountId)).toEqual([
            'btc',
            'evm',
            'evm',
            'evm',
            'evm',
            'evm',
        ]);
        expect(result.current.hasErrors).toBe(false);
    });

    it('never asks a network without tokens for them', async () => {
        const { result } = renderAssets([btc.network], [btcAccount]);

        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(summarize(result.current.assets)).toEqual([
            ['btc', 'native', 'BTC', '1.49', '89400'],
        ]);
        expect(btc.getTokens).not.toHaveBeenCalled();
    });

    it('fetches a chain account shared by two accounts once and lists it for both', async () => {
        const { result } = renderAssets([btc.network], [btcAccount, { ...btcAccount, id: 'btc2' }]);

        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(btc.getAccountBalance).toHaveBeenCalledTimes(1);
        expect(result.current.assets.map(({ accountId }) => accountId)).toEqual(['btc', 'btc2']);
    });

    it('asks for a token rate once per network and contract', async () => {
        const { result } = renderAssets([eth.network], [evmAccount, { ...evmAccount, id: 'evm2' }]);

        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(eth.getTokens).toHaveBeenCalledTimes(1);
        expect(eth.getTokenFiatRate.mock.calls.map(([params]) => params.contract)).toEqual([
            '0xweth',
            '0xwbtc',
        ]);
    });

    it('is pending and fetches nothing while disabled', () => {
        const { result } = renderAssets([eth.network], [evmAccount], false);

        expect(result.current).toEqual({ assets: [], isPending: true, hasErrors: false });
        expect(eth.getAccountBalance).not.toHaveBeenCalled();
        expect(eth.getTokens).not.toHaveBeenCalled();
    });
});
