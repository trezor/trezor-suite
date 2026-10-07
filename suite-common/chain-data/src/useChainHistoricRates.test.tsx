/**
 * @jest-environment jsdom
 */
import { renderHookWithQueryClient, waitFor } from '@suite-common/test-utils';
import type { Transaction } from '@trezor/blockchain-link-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { useChainHistoricRates } from './useChainHistoricRates';
import { createFakeChainNetwork } from '../mocks/createFakeChainNetwork';

const HOUR = 3600;

const tx = (blockTime: number, contracts: string[] = []) =>
    ({ blockTime, tokens: contracts.map(contract => ({ contract })) }) as unknown as Transaction;

const eth = createFakeChainNetwork({
    symbol: asNetworkSymbol('eth'),
    balances: {},
    rate: null,
    historicRates: { '': { [HOUR]: 3000, [2 * HOUR]: 3100 }, '0xusdc': { [HOUR]: 1 } },
});

const pages = [
    { transactions: [tx(2 * HOUR + 5), tx(HOUR + 5, ['0xusdc'])], nextCursor: null, total: 2 },
];

describe('useChainHistoricRates', () => {
    it('keeps past rates by rate key and hour, like the wallet does', async () => {
        const { result } = renderHookWithQueryClient(() =>
            useChainHistoricRates({
                network: eth.network,
                pages,
                currencies: ['usd'],
                enabled: true,
            }),
        );

        await waitFor(() =>
            expect(result.current).toEqual({
                'eth-usd': { [HOUR]: 3000, [2 * HOUR]: 3100 },
                'eth-0xusdc-usd': { [HOUR]: 1 },
            }),
        );
        expect(eth.getHistoricFiatRates).toHaveBeenCalledTimes(2);
    });

    it('asks once for pages with the same assets and hours', async () => {
        eth.getHistoricFiatRates.mockClear();
        const samePage = { transactions: [tx(HOUR + 10)], nextCursor: null, total: 2 };

        const { result } = renderHookWithQueryClient(() =>
            useChainHistoricRates({
                network: eth.network,
                pages: [samePage, samePage],
                currencies: ['usd'],
                enabled: true,
            }),
        );

        await waitFor(() => expect(result.current).toEqual({ 'eth-usd': { [HOUR]: 3000 } }));
        expect(eth.getHistoricFiatRates).toHaveBeenCalledTimes(1);
    });

    it('asks nothing while disabled', () => {
        eth.getHistoricFiatRates.mockClear();

        renderHookWithQueryClient(() =>
            useChainHistoricRates({
                network: eth.network,
                pages,
                currencies: ['usd'],
                enabled: false,
            }),
        );

        expect(eth.getHistoricFiatRates).not.toHaveBeenCalled();
    });
});
