import { type Store } from '@reduxjs/toolkit';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { tradingExchangeActions } from '@suite-common/trading';
import { eth1NormalAccount, mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';
import { useExchangeSwapAssets } from './useExchangeSwapAssets';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

jest.mock('./useDexExchangeTxSimulation', () => ({
    useDexExchangeTxSimulation: jest.fn(),
}));

const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);

describe('useExchangeSwapAssets', () => {
    let store: Store<TradingRootState>;

    const renderSwapAssets = (quote = mercuryoFixedWorstQuote) =>
        renderHookWithTradingProvider(() => useExchangeSwapAssets(quote), {
            services: { store, networks: mockNetworksServices() },
            tradeType: 'exchange',
        });

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: false,
            isLoading: false,
            error: null,
            data: undefined,
        });

        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));
    });

    it('returns the pay asset of the send account', async () => {
        const { result } = await renderSwapAssets();

        expect(result.current.payAsset).toMatchObject({
            type: 'crypto',
            accountLabel: 'ETH Account #1',
            amount: mercuryoFixedWorstQuote.sendStringAmount,
            cryptoId: mercuryoFixedWorstQuote.send,
        });
    });

    it('returns the get asset with the receive amount', async () => {
        const { result } = await renderSwapAssets();

        expect(result.current.getAsset).toMatchObject({
            type: 'crypto',
            amount: mercuryoFixedWorstQuote.receiveStringAmount,
            cryptoId: mercuryoFixedWorstQuote.receive,
        });
    });

    it('returns no assets without a quote', async () => {
        const { result } = await renderHookWithTradingProvider(
            () => useExchangeSwapAssets(undefined),
            { services: { store, networks: mockNetworksServices() }, tradeType: 'exchange' },
        );

        expect(result.current).toEqual({ payAsset: undefined, getAsset: undefined });
    });
});
