import { act, waitFor } from '@testing-library/react';
import { type Coins } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type LoadInitialDataThunkDeps,
    prepareTradingReducer,
    tradeApi,
    initialState as tradingInitialState,
    tradingThunks,
} from '@suite-common/trading';
import { mockGetTradingEnvironment, mockTradingQueryClient } from '@suite-common/trading/mocks';
import { createDeferred } from '@trezor/utils';

import { renderHookWithProviders } from '#src/support/test-utils/hooksHelper';

import { useIsTradingCoinInfoSettled } from './useIsTradingCoinInfoSettled';
import { mockExtraDependenciesForReducers } from '../../../../../../mocks/mockExtraDependenciesForReducers';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

type CoinInfoResponse = Awaited<ReturnType<typeof tradeApi.getInfo>>;

const coins = {
    bitcoin: {
        symbol: 'btc',
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        services: { buy: true, sell: true, exchange: true },
    },
} satisfies Coins;

const tradingReducer = prepareTradingReducer(mockExtraDependenciesForReducers);

const renderCoinInfoSettled = (trading = tradingInitialState) => {
    const state: MockSuiteState = {
        ...mockInitialAppState,
        wallet: { ...mockInitialAppState.wallet, trading },
    };
    const { services } = createTestCompositionRoot<LoadInitialDataThunkDeps, MockSuiteState>({
        // Only the trading state changes, when the coin info is saved.
        reducer: (currentState = state, action) => ({
            ...currentState,
            wallet: {
                ...currentState.wallet,
                trading: tradingReducer(currentState.wallet.trading, action),
            },
        }),
        preloadedState: state,
        services: () => ({
            getSelectedAccount: () => ({ status: 'none', account: undefined }),
            getTradingEnvironment: mockGetTradingEnvironment(),
            queryClient: mockTradingQueryClient(),
        }),
    });
    const { result } = renderHookWithProviders(services, () => useIsTradingCoinInfoSettled());

    return {
        result,
        loadCoinInfo: () =>
            services.store.dispatch(
                tradingThunks.loadInitialDataThunk({ activeSection: 'buy', catalogs: ['info'] }),
            ),
    };
};

const loadCoinInfoUntil = async (response: CoinInfoResponse) => {
    const pendingCoinInfo = createDeferred<CoinInfoResponse>();
    jest.spyOn(tradeApi, 'getInfo').mockReturnValue(pendingCoinInfo.promise);
    const { result, loadCoinInfo } = renderCoinInfoSettled();

    expect(result.current).toBe(false);

    act(() => {
        loadCoinInfo();
    });

    expect(result.current).toBe(false);

    await act(() => pendingCoinInfo.resolve(response));

    return result;
};

describe('useIsTradingCoinInfoSettled', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('settles once the coin info is saved', async () => {
        const result = await loadCoinInfoUntil({
            coins,
            platforms: {},
            config: { btcSwapComposeTemplate: { extraOutputs: [] } },
        });

        await waitFor(() => expect(result.current).toBe(true));
    });

    it('settles when the coin info request fails', async () => {
        const result = await loadCoinInfoUntil(undefined);

        await waitFor(() => expect(result.current).toBe(true));
    });

    it('is settled when the coin info is already in the store', () => {
        const { result } = renderCoinInfoSettled({
            ...tradingInitialState,
            info: { ...tradingInitialState.info, coins },
        });

        expect(result.current).toBe(true);
    });
});
