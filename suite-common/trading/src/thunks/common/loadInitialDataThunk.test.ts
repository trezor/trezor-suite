import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { type SelectedAccountStatus, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { createDeferred } from '@trezor/utils';

import { type LoadInitialDataThunkDeps, loadInitialDataThunk } from './loadInitialDataThunk';
import coinsFixture from '../../__fixtures__/coins.json';
import platformsFixture from '../../__fixtures__/platforms.json';
import { TRADE_API_RELOAD_DATA_AFTER_MS, TRADING_FALLBACK_API_KEY } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import {
    type TradingState,
    initialState,
    tradingActions,
} from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradeApi } from '../../tradeApi';

jest.mock('../../tradeApi');

const account = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('firstAccount'),
});
const otherAccount = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('secondAccount'),
});
const info = { coins: {}, platforms: {}, config: {} };
const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const initRoot = (tradingState: Partial<TradingState> = {}) => {
    const getSelectedAccount = jest.fn<SelectedAccountStatus, []>(() => ({
        status: 'none',
        account: undefined,
    }));
    const extra: LoadInitialDataThunkDeps = {
        services: {
            getSelectedAccount,
            getTradingEnvironment: () => 'localhost',
        },
    };

    const root = createTestCompositionRoot({
        extra,
        reducer: {
            wallet: combineReducers({
                trading: tradingReducer,
                accounts: () => [account, otherAccount],
            }),
        },
        preloadedState: {
            wallet: { trading: { ...initialState, ...tradingState } },
        },
    });

    return { ...root, getSelectedAccount };
};

const expectCatalogCalls = (count: number) => {
    expect(tradeApi.getInfo).toHaveBeenCalledTimes(count);
    expect(tradeApi.getBuyList).toHaveBeenCalledTimes(count);
    expect(tradeApi.getExchangeList).toHaveBeenCalledTimes(count);
    expect(tradeApi.getSellList).toHaveBeenCalledTimes(count);
};

const initLoadedRoot = async () => {
    const root = initRoot();
    await root.services.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();
    jest.clearAllMocks();

    return root;
};

describe('loadInitialDataThunk catalog cache', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
        jest.mocked(tradeApi.getInfo).mockResolvedValue(info);
        jest.mocked(tradeApi.getExchangeList).mockResolvedValue([]);
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue('http://localhost:3330');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('loads the complete catalog on first use', async () => {
        const { store, services } = initRoot();

        await services.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();

        expectCatalogCalls(1);
        expect(store.getState().wallet.trading).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: Date.now(),
        });
        expect(tradeApi.setServersEnvironment).toHaveBeenCalledWith('localhost');
        expect(tradeApi.createApiKey).toHaveBeenCalledWith(TRADING_FALLBACK_API_KEY);
    });

    it.each(['exchange', 'sell', 'buy'] as const)(
        'reuses the catalog, including empty fallbacks, when opening %s without accounts',
        async activeSection => {
            const { store, services } = await initLoadedRoot();
            const timestamp = store.getState().wallet.trading.lastLoadedTimestamp;
            jest.spyOn(Date, 'now').mockReturnValue(timestamp + 1);

            await services.dispatch(loadInitialDataThunk({ activeSection })).unwrap();

            expect(store.getState().wallet.trading.activeSection).toBe(activeSection);
            expectCatalogCalls(0);
            expect(store.getState().wallet.trading.lastLoadedTimestamp).toBe(timestamp);
            expect(services.getActions().filter(tradingActions.setLoading.match)).toHaveLength(2);
        },
    );

    it.each([
        { scenario: 'selection', previousAccount: undefined, selectedAccount: account },
        { scenario: 'change', previousAccount: account, selectedAccount: otherAccount },
        { scenario: 'disconnect', previousAccount: account, selectedAccount: undefined },
    ])(
        'updates API identity on account $scenario without reloading',
        async ({ previousAccount, selectedAccount }) => {
            const { services } = await initLoadedRoot();
            services.dispatch(tradingBuyActions.setTradingAccountKey(previousAccount?.key));
            await services.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();
            jest.mocked(tradeApi.createApiKey).mockClear();

            services.dispatch(tradingBuyActions.setTradingAccountKey(selectedAccount?.key));
            await services.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();

            expect(tradeApi.createApiKey).toHaveBeenCalledWith(
                selectedAccount?.descriptor || TRADING_FALLBACK_API_KEY,
            );
            expectCatalogCalls(0);
        },
    );

    it('preserves desktop selected-account and forced-key precedence on cache hits', async () => {
        const { services, getSelectedAccount } = await initLoadedRoot();
        const selectedAccount: SelectedAccountStatus = {
            status: 'loaded',
            account,
            network: getNetwork(account.symbol),
            params: undefined,
        };
        getSelectedAccount.mockReturnValue(selectedAccount);
        await services
            .dispatch(loadInitialDataThunk({ activeSection: 'buy', forcedApiKey: 'forced' }))
            .unwrap();
        expect(tradeApi.createApiKey).toHaveBeenLastCalledWith(account.descriptor);

        getSelectedAccount.mockReturnValue({
            status: 'none',
            account: undefined,
        });
        await services
            .dispatch(loadInitialDataThunk({ activeSection: 'buy', forcedApiKey: 'forced' }))
            .unwrap();
        expect(tradeApi.createApiKey).toHaveBeenLastCalledWith('forced');
        await services
            .dispatch(loadInitialDataThunk({ activeSection: 'buy', forcedApiKey: '' }))
            .unwrap();
        expect(tradeApi.createApiKey).toHaveBeenLastCalledWith(TRADING_FALLBACK_API_KEY);
        expectCatalogCalls(0);
    });

    it.each([
        TRADE_API_RELOAD_DATA_AFTER_MS - 1,
        TRADE_API_RELOAD_DATA_AFTER_MS,
        TRADE_API_RELOAD_DATA_AFTER_MS + 1,
    ])('honors the expiry boundary at an age of %i ms with populated cache entries', async age => {
        const { store, services } = await initLoadedRoot();
        const timestamp = store.getState().wallet.trading.lastLoadedTimestamp;
        jest.spyOn(Date, 'now').mockReturnValue(timestamp + age);

        await services.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();

        const isExpired = age >= TRADE_API_RELOAD_DATA_AFTER_MS;
        expectCatalogCalls(isExpired ? 1 : 0);
        expect(store.getState().wallet.trading.lastLoadedTimestamp).toBe(
            isExpired ? Date.now() : timestamp,
        );
    });

    it.each(['info', 'buy', 'exchange', 'sell'] as const)(
        'fetches only missing %s data without extending the shared lifetime',
        async missing => {
            const loaded = await initLoadedRoot();
            const cached = loaded.store.getState().wallet.trading;
            const { store, services } = initRoot({
                ...cached,
                info: missing === 'info' ? {} : cached.info,
                buy: { ...cached.buy, buyInfo: missing === 'buy' ? undefined : cached.buy.buyInfo },
                exchange: {
                    ...cached.exchange,
                    exchangeInfo: missing === 'exchange' ? undefined : cached.exchange.exchangeInfo,
                },
                sell: {
                    ...cached.sell,
                    sellInfo: missing === 'sell' ? undefined : cached.sell.sellInfo,
                },
            });
            jest.spyOn(Date, 'now').mockReturnValue(cached.lastLoadedTimestamp + 100);

            await services.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();

            expect(tradeApi.getInfo).toHaveBeenCalledTimes(missing === 'info' ? 1 : 0);
            expect(tradeApi.getBuyList).toHaveBeenCalledTimes(missing === 'buy' ? 1 : 0);
            expect(tradeApi.getExchangeList).toHaveBeenCalledTimes(missing === 'exchange' ? 1 : 0);
            expect(tradeApi.getSellList).toHaveBeenCalledTimes(missing === 'sell' ? 1 : 0);
            expect(store.getState().wallet.trading.lastLoadedTimestamp).toBe(
                cached.lastLoadedTimestamp,
            );
        },
    );

    it('explicit Retry refreshes all fresh entries, including empty fallback results', async () => {
        const { store, services } = await initLoadedRoot();
        jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 100);

        await services
            .dispatch(loadInitialDataThunk({ activeSection: 'sell', forceReload: true }))
            .unwrap();

        expectCatalogCalls(1);
        expect(store.getState().wallet.trading.lastLoadedTimestamp).toBe(Date.now());
    });

    it.each(['first use', 'expiry', 'retry'] as const)(
        'loads all catalog resources in parallel on %s',
        async scenario => {
            const { store, services } =
                scenario === 'first use' ? initRoot() : await initLoadedRoot();
            const timestamp = store.getState().wallet.trading.lastLoadedTimestamp;
            if (scenario === 'expiry') {
                jest.spyOn(Date, 'now').mockReturnValue(timestamp + TRADE_API_RELOAD_DATA_AFTER_MS);
            }
            const pendingInfo = createDeferred<typeof info>();
            jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);

            const load = services.dispatch(
                loadInitialDataThunk({ activeSection: 'buy', forceReload: scenario === 'retry' }),
            );

            try {
                expectCatalogCalls(1);
                expect(store.getState().wallet.trading).toMatchObject({
                    isLoading: true,
                    lastLoadedTimestamp: timestamp,
                });
            } finally {
                pendingInfo.resolve(info);
                await load.unwrap();
            }

            expect(store.getState().wallet.trading).toMatchObject({
                isLoading: false,
                lastLoadedTimestamp: Date.now(),
            });
        },
    );

    it('deduplicates overlapping loads while updating the latest section and API identity', async () => {
        const { store, services } = initRoot();
        const pendingInfo = createDeferred<typeof info>();
        jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);
        const firstLoad = services.dispatch(loadInitialDataThunk({ activeSection: 'buy' }));
        services.dispatch(tradingExchangeActions.setTradingAccountKey(otherAccount.key));

        await services
            .dispatch(loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }))
            .unwrap();

        expect(store.getState().wallet.trading.isLoading).toBe(true);
        expect(store.getState().wallet.trading.activeSection).toBe('exchange');
        expect(tradeApi.createApiKey).toHaveBeenLastCalledWith(otherAccount.descriptor);
        expect(tradeApi.getInfo).toHaveBeenCalledTimes(1);
        pendingInfo.resolve(info);
        await firstLoad.unwrap();
        expectCatalogCalls(1);
    });

    it.each(['getInfo', 'getBuyList', 'getExchangeList', 'getSellList'] as const)(
        'releases loading after an unexpected %s rejection without advancing freshness',
        async request => {
            const { store, services } = await initLoadedRoot();
            const timestamp = store.getState().wallet.trading.lastLoadedTimestamp;
            jest.spyOn(Date, 'now').mockReturnValue(timestamp + 100);
            jest.mocked(tradeApi[request]).mockRejectedValueOnce(new Error('Unexpected failure'));

            await expect(
                services
                    .dispatch(loadInitialDataThunk({ activeSection: 'buy', forceReload: true }))
                    .unwrap(),
            ).rejects.toMatchObject({ message: 'Unexpected failure' });

            expect(store.getState().wallet.trading).toMatchObject({
                isLoading: false,
                lastLoadedTimestamp: timestamp,
            });
            await services
                .dispatch(loadInitialDataThunk({ activeSection: 'buy', forceReload: true }))
                .unwrap();
            expect(store.getState().wallet.trading.lastLoadedTimestamp).toBe(Date.now());
        },
    );

    it('refreshes the catalog after debug server invalidation', async () => {
        const { store, services } = await initLoadedRoot();
        services.dispatch(tradingActions.invalidateCatalog());
        expect(store.getState().wallet.trading.lastLoadedTimestamp).toBe(0);

        await services.dispatch(loadInitialDataThunk({ activeSection: 'sell' })).unwrap();

        expectCatalogCalls(1);
    });

    it('does not mark a load fresh if the debug server changes while it is running', async () => {
        const { store, services } = await initLoadedRoot();
        const pendingInfo = createDeferred<typeof info>();
        jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);
        const load = services.dispatch(
            loadInitialDataThunk({ activeSection: 'buy', forceReload: true }),
        );
        services.dispatch(tradingActions.invalidateCatalog());
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue('https://staging-exchange.trezor.io');
        pendingInfo.resolve(info);
        await load.unwrap();

        expect(store.getState().wallet.trading).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
    });

    it.each(['retry', 'expiry'] as const)(
        'keeps existing coins and platforms when getInfo fails during %s',
        async scenario => {
            const timestamp = Date.now();
            const { store, services } = initRoot({
                info: {
                    coins: coinsFixture,
                    platforms: platformsFixture,
                },
                lastLoadedTimestamp: timestamp,
            });
            jest.mocked(tradeApi.getInfo).mockResolvedValueOnce(undefined);
            if (scenario === 'expiry') {
                jest.spyOn(Date, 'now').mockReturnValue(timestamp + TRADE_API_RELOAD_DATA_AFTER_MS);
            }

            await services
                .dispatch(
                    loadInitialDataThunk({
                        activeSection: 'buy',
                        forceReload: scenario === 'retry',
                    }),
                )
                .unwrap();

            expect(tradeApi.getInfo).toHaveBeenCalledTimes(1);
            expect(store.getState().wallet.trading.info.coins).toEqual(coinsFixture);
            expect(store.getState().wallet.trading.info.platforms).toEqual(platformsFixture);
            expect(services.getActions().filter(tradingActions.saveInfo.match)).toHaveLength(0);
        },
    );
});
