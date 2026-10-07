/**
 * @jest-environment jsdom
 */
import { renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';
import type { ChainNetwork } from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import type { PortfolioAccount } from './PortfolioAccount';
import { useAccountsFiatBalance } from './useAccountsFiatBalance';
import { createFakeChainNetwork } from '../mocks/createFakeChainNetwork';

const btc = createFakeChainNetwork({
    symbol: asNetworkSymbol('btc'),
    balances: { zpub1: '1', zpub2: '0.5' },
    rate: { rate: 60000, timestamp: 1 },
});
const eth = createFakeChainNetwork({
    symbol: asNetworkSymbol('eth'),
    balances: { '0xabc': '2' },
    rate: { rate: 3000, timestamp: 1 },
});
const base = createFakeChainNetwork({
    symbol: asNetworkSymbol('base'),
    balances: { '0xabc': '1' },
    rate: { rate: 3000, timestamp: 1 },
});
const sol = createFakeChainNetwork({
    symbol: asNetworkSymbol('sol'),
    balances: { solAddress: '10' },
    rate: null,
});

const singleChain = (id: string, symbol: 'btc' | 'sol', descriptor: string): PortfolioAccount => ({
    id,
    chainAccounts: [{ symbol: asNetworkSymbol(symbol), descriptor, accountType: 'normal' }],
});

// One EVM address used on Ethereum and Base: one user-facing account, two chain accounts.
const evmAccount: PortfolioAccount = {
    id: 'evm',
    chainAccounts: [
        { symbol: asNetworkSymbol('eth'), descriptor: '0xabc', accountType: 'normal' },
        { symbol: asNetworkSymbol('base'), descriptor: '0xabc', accountType: 'normal' },
    ],
};

const renderFiatBalance = (
    networks: readonly ChainNetwork[],
    accounts: readonly PortfolioAccount[],
    enabled = true,
) =>
    renderHookWithQueryClient(() =>
        useAccountsFiatBalance({ networks, accounts, currency: 'usd', enabled }),
    );

describe('useAccountsFiatBalance', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sums accounts across networks, including one account on several chains', async () => {
        const { result } = renderFiatBalance(
            [btc.network, eth.network, base.network],
            [singleChain('btc1', 'btc', 'zpub1'), singleChain('btc2', 'btc', 'zpub2'), evmAccount],
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));

        // 1.5 BTC × 60000 + (2 + 1) ETH × 3000
        expect(result.current).toEqual({
            fiatBalance: '99000',
            isPending: false,
            hasErrors: false,
            isPartial: false,
            isCovered: true,
        });
        expect(btc.getNativeFiatRate).toHaveBeenCalledTimes(1);
        expect(eth.getAccountBalance).toHaveBeenCalledTimes(1);
        expect(base.getAccountBalance).toHaveBeenCalledTimes(1);
    });

    it('marks the sum partial when a network has no rate', async () => {
        const { result } = renderFiatBalance(
            [btc.network, sol.network],
            [singleChain('btc1', 'btc', 'zpub1'), singleChain('sol', 'sol', 'solAddress')],
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(result.current).toMatchObject({ fiatBalance: '60000', isPartial: true });
    });

    it('reports accounts on networks that are not selected', async () => {
        const { result } = renderFiatBalance(
            [btc.network],
            [singleChain('btc1', 'btc', 'zpub1'), evmAccount],
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(result.current).toMatchObject({ fiatBalance: '60000', isCovered: false });
        expect(eth.getAccountBalance).not.toHaveBeenCalled();
    });

    it('is pending and fetches nothing while disabled', () => {
        const { result } = renderFiatBalance(
            [btc.network],
            [singleChain('btc1', 'btc', 'zpub1')],
            false,
        );

        expect(result.current).toMatchObject({ fiatBalance: null, isPending: true });
        expect(btc.getAccountBalance).not.toHaveBeenCalled();
        expect(btc.getNativeFiatRate).not.toHaveBeenCalled();
    });

    it('reports a failed balance as an error', async () => {
        // The first attempt and the one retry balance queries make.
        btc.getAccountBalance
            .mockRejectedValueOnce(new Error('offline'))
            .mockRejectedValueOnce(new Error('offline'));
        const { result } = renderFiatBalance([btc.network], [singleChain('btc1', 'btc', 'zpub1')]);

        await waitFor(() => expect(result.current.isPending).toBe(false), { timeout: 3000 });

        expect(result.current).toMatchObject({
            fiatBalance: null,
            hasErrors: true,
            isPartial: true,
        });
    });
});
