import { combineReducers } from '@reduxjs/toolkit';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type SelectedAccountStatus, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockActionType } from '@trezor/redux-utils/mocks';
import { createDeferred } from '@trezor/utils';

import {
    type LoadInitialDataThunkDeps,
    type LoadInitialDataThunkState,
    loadInitialDataThunk,
} from './loadInitialDataThunk';
import coinsFixture from '../../__fixtures__/coins.json';
import platformsFixture from '../../__fixtures__/platforms.json';
import { TRADE_API_RELOAD_DATA_AFTER_MS, TRADING_ANONYMOUS_ID } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import {
    type TradingState,
    initialState,
    tradingActions,
} from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradeApi } from '../../tradeApi';
import { createInstallTradeApiKey, createSaltedTradeApiKey } from '../../utils/tradeApiSaltUtils';

jest.mock('../../tradeApi');

const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('firstAccount'),
});
const otherAccount = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    descriptor: asAccountDescriptor('secondAccount'),
});
const info = {
    coins: {},
    platforms: {},
    config: { btcSwapComposeTemplate: { extraOutputs: [] } },
};
const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const initTestServices = (tradingState: Partial<TradingState> = {}) => {
    const getSelectedAccount = jest.fn<SelectedAccountStatus, []>(() => ({
        status: 'none',
        account: undefined,
    }));
    const { services } = createTestCompositionRoot<
        LoadInitialDataThunkDeps,
        LoadInitialDataThunkState
    >({
        reducer: {
            wallet: combineReducers({
                trading: tradingReducer,
                accounts: () => [account, otherAccount],
            }),
        },
        preloadedState: {
            wallet: { trading: { ...initialState, ...tradingState } },
        },
        services: () => ({
            getSelectedAccount,
            getTradingEnvironment: () => 'localhost',
        }),
    });

    return { services, getSelectedAccount };
};

type CatalogCallCounts = {
    shared: number;
    exchange: number;
};

const expectCatalogCalls = ({ shared, exchange }: CatalogCallCounts) => {
    expect(tradeApi.getInfo).toHaveBeenCalledTimes(shared);
    expect(tradeApi.getBuyList).toHaveBeenCalledTimes(shared);
    expect(tradeApi.getSellList).toHaveBeenCalledTimes(shared);
    expect(tradeApi.getExchangeList).toHaveBeenCalledTimes(exchange);
};

const initLoadedTestServices = async () => {
    const { services, getSelectedAccount } = initTestServices();
    await services.store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap();
    jest.clearAllMocks();

    return { services, getSelectedAccount };
};

const selectExchangeCatalog = (services: ReturnType<typeof initTestServices>['services']) => {
    const { exchangeInfo, isExchangeInfoLoading, exchangeInfoLoadedTimestamp } =
        services.store.getState().wallet.trading.exchange;

    return { exchangeInfo, isExchangeInfoLoading, exchangeInfoLoadedTimestamp };
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

    it('loads the coin info and the buy and sell catalogs on first use', async () => {
        const { services } = initTestServices();

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'sell' })).unwrap();

        expectCatalogCalls({ shared: 1, exchange: 0 });
        expect(services.store.getState().wallet.trading).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: Date.now(),
        });
        expect(selectExchangeCatalog(services)).toEqual({
            exchangeInfo: undefined,
            isExchangeInfoLoading: false,
            exchangeInfoLoadedTimestamp: 0,
        });
        expect(tradeApi.setServersEnvironment).toHaveBeenCalledWith('localhost');
        expect(tradeApi.createAnonymousApiKey).toHaveBeenCalledWith(TRADING_ANONYMOUS_ID);
        expect(tradeApi.setApiKey).not.toHaveBeenCalled();
    });

    it.each([
        { activeSection: 'buy', catalogSection: undefined, exchange: 0 },
        { activeSection: 'sell', catalogSection: undefined, exchange: 0 },
        { activeSection: 'exchange', catalogSection: undefined, exchange: 1 },
        { activeSection: 'exchange', catalogSection: 'buy', exchange: 0 },
        { activeSection: 'buy', catalogSection: 'exchange', exchange: 1 },
    ] as const)(
        'loads the swap catalog only for the swap section (active $activeSection, catalog $catalogSection)',
        async ({ activeSection, catalogSection, exchange }) => {
            const { services } = initTestServices();

            await services.store
                .dispatch(loadInitialDataThunk({ activeSection, catalogSection }))
                .unwrap();

            expectCatalogCalls({ shared: 1, exchange });
            expect(services.store.getState().wallet.trading.activeSection).toBe(activeSection);
            expect(selectExchangeCatalog(services)).toEqual({
                exchangeInfo: exchange
                    ? { providerInfos: {}, buyCryptoIds: [], sellCryptoIds: [] }
                    : undefined,
                isExchangeInfoLoading: false,
                exchangeInfoLoadedTimestamp: exchange ? Date.now() : 0,
            });
        },
    );

    it('keeps the swap catalog on its own lifetime', async () => {
        const { services } = initTestServices();
        const start = Date.now();
        const loadAt = async (age: number, activeSection: 'buy' | 'exchange') => {
            jest.spyOn(Date, 'now').mockReturnValue(start + age);
            jest.clearAllMocks();
            await services.store.dispatch(loadInitialDataThunk({ activeSection })).unwrap();
        };
        const halfLife = TRADE_API_RELOAD_DATA_AFTER_MS / 2;

        await loadAt(0, 'buy');
        await loadAt(halfLife, 'exchange');
        expectCatalogCalls({ shared: 0, exchange: 1 });
        expect(services.store.getState().wallet.trading.lastLoadedTimestamp).toBe(start);

        await loadAt(TRADE_API_RELOAD_DATA_AFTER_MS, 'buy');
        expectCatalogCalls({ shared: 1, exchange: 0 });

        await loadAt(TRADE_API_RELOAD_DATA_AFTER_MS + halfLife - 1, 'exchange');
        expectCatalogCalls({ shared: 0, exchange: 0 });

        await loadAt(TRADE_API_RELOAD_DATA_AFTER_MS + halfLife, 'exchange');
        expectCatalogCalls({ shared: 0, exchange: 1 });
        expect(selectExchangeCatalog(services).exchangeInfoLoadedTimestamp).toBe(Date.now());
    });

    it.each(['exchange', 'sell', 'buy'] as const)(
        'reuses the catalog, including empty fallbacks, when opening %s without accounts',
        async activeSection => {
            const { services } = await initLoadedTestServices();
            const timestamp = services.store.getState().wallet.trading.lastLoadedTimestamp;
            jest.spyOn(Date, 'now').mockReturnValue(timestamp + 1);

            await services.store.dispatch(loadInitialDataThunk({ activeSection })).unwrap();

            expect(services.store.getState().wallet.trading.activeSection).toBe(activeSection);
            expectCatalogCalls({ shared: 0, exchange: 0 });
            expect(services.store.getState().wallet.trading.lastLoadedTimestamp).toBe(timestamp);
            expect(
                services.store.getActions().filter(tradingActions.setLoading.match),
            ).toHaveLength(2);
        },
    );

    it.each([
        { scenario: 'selection', previousAccount: undefined, selectedAccount: account },
        { scenario: 'change', previousAccount: account, selectedAccount: otherAccount },
        { scenario: 'disconnect', previousAccount: account, selectedAccount: undefined },
    ])(
        'updates API identity on account $scenario without reloading',
        async ({ previousAccount, selectedAccount }) => {
            const { services } = await initLoadedTestServices();
            services.store.dispatch(tradingSellActions.setTradingAccountKey(previousAccount?.key));
            await services.store.dispatch(loadInitialDataThunk({ activeSection: 'sell' })).unwrap();
            jest.mocked(tradeApi.setApiKey).mockClear();
            jest.mocked(tradeApi.createAnonymousApiKey).mockClear();

            services.store.dispatch(tradingSellActions.setTradingAccountKey(selectedAccount?.key));
            await services.store.dispatch(loadInitialDataThunk({ activeSection: 'sell' })).unwrap();

            const { tradeApiInstallSalt } = services.store.getState().wallet.trading;
            expect(jest.mocked(tradeApi.setApiKey).mock.calls).toEqual(
                selectedAccount
                    ? [
                          [
                              createSaltedTradeApiKey({
                                  descriptor: selectedAccount.descriptor,
                                  salt: tradeApiInstallSalt ?? '',
                              }),
                          ],
                      ]
                    : [],
            );
            expect(jest.mocked(tradeApi.createAnonymousApiKey).mock.calls).toEqual(
                selectedAccount ? [] : [[TRADING_ANONYMOUS_ID]],
            );
            expectCatalogCalls({ shared: 0, exchange: 0 });
        },
    );

    it('requests buy data with the key of the buy receive account', async () => {
        const { services } = initTestServices();
        services.store.dispatch(tradingBuyActions.setTradingAccountKey(account.key));
        services.store.dispatch(tradingBuyActions.setReceiveAccountKey(otherAccount.key));

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();

        expect(tradeApi.setApiKey).toHaveBeenLastCalledWith(
            createSaltedTradeApiKey({
                descriptor: otherAccount.descriptor,
                salt: services.store.getState().wallet.trading.tradeApiInstallSalt ?? '',
            }),
        );
    });

    it('requests buy data with the install key when no receive account is selected', async () => {
        const { services, getSelectedAccount } = initTestServices();
        getSelectedAccount.mockReturnValue({
            status: 'loaded',
            account,
            network: getNetwork(account.symbol),
            params: undefined,
        });

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();

        expect(tradeApi.setApiKey).toHaveBeenLastCalledWith(
            createInstallTradeApiKey(
                services.store.getState().wallet.trading.tradeApiInstallSalt ?? '',
            ),
        );
    });

    it('preserves desktop selected-account and forced anonymous id precedence on cache hits', async () => {
        const { services, getSelectedAccount } = await initLoadedTestServices();
        const selectedAccount: SelectedAccountStatus = {
            status: 'loaded',
            account,
            network: getNetwork(account.symbol),
            params: undefined,
        };
        getSelectedAccount.mockReturnValue(selectedAccount);
        await services.store
            .dispatch(loadInitialDataThunk({ activeSection: 'sell', forcedAnonymousId: 'forced' }))
            .unwrap();
        expect(tradeApi.setApiKey).toHaveBeenLastCalledWith(
            createSaltedTradeApiKey({
                descriptor: account.descriptor,
                salt: services.store.getState().wallet.trading.tradeApiInstallSalt ?? '',
            }),
        );

        getSelectedAccount.mockReturnValue({
            status: 'none',
            account: undefined,
        });
        await services.store
            .dispatch(loadInitialDataThunk({ activeSection: 'sell', forcedAnonymousId: 'forced' }))
            .unwrap();
        expect(tradeApi.createAnonymousApiKey).toHaveBeenLastCalledWith('forced');
        await services.store
            .dispatch(loadInitialDataThunk({ activeSection: 'sell', forcedAnonymousId: '' }))
            .unwrap();
        expect(tradeApi.createAnonymousApiKey).toHaveBeenLastCalledWith(TRADING_ANONYMOUS_ID);
        expectCatalogCalls({ shared: 0, exchange: 0 });
    });

    it.each([
        TRADE_API_RELOAD_DATA_AFTER_MS - 1,
        TRADE_API_RELOAD_DATA_AFTER_MS,
        TRADE_API_RELOAD_DATA_AFTER_MS + 1,
    ])('honors the expiry boundary at an age of %i ms with populated cache entries', async age => {
        const { services } = await initLoadedTestServices();
        const timestamp = services.store.getState().wallet.trading.lastLoadedTimestamp;
        jest.spyOn(Date, 'now').mockReturnValue(timestamp + age);

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap();

        const isExpired = age >= TRADE_API_RELOAD_DATA_AFTER_MS;
        expectCatalogCalls({ shared: isExpired ? 1 : 0, exchange: isExpired ? 1 : 0 });
        expect(services.store.getState().wallet.trading.lastLoadedTimestamp).toBe(
            isExpired ? Date.now() : timestamp,
        );
        expect(selectExchangeCatalog(services).exchangeInfoLoadedTimestamp).toBe(
            isExpired ? Date.now() : timestamp,
        );
    });

    it.each(['info', 'buy', 'sell'] as const)(
        'fetches only missing %s data without extending the shared lifetime',
        async missing => {
            const loaded = await initLoadedTestServices();
            const cached = loaded.services.store.getState().wallet.trading;
            const { services } = initTestServices({
                ...cached,
                info: missing === 'info' ? {} : cached.info,
                buy: { ...cached.buy, buyInfo: missing === 'buy' ? undefined : cached.buy.buyInfo },
                sell: {
                    ...cached.sell,
                    sellInfo: missing === 'sell' ? undefined : cached.sell.sellInfo,
                },
            });
            jest.spyOn(Date, 'now').mockReturnValue(cached.lastLoadedTimestamp + 100);

            await services.store.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();

            expect(tradeApi.getInfo).toHaveBeenCalledTimes(missing === 'info' ? 1 : 0);
            expect(tradeApi.getBuyList).toHaveBeenCalledTimes(missing === 'buy' ? 1 : 0);
            expect(tradeApi.getExchangeList).not.toHaveBeenCalled();
            expect(tradeApi.getSellList).toHaveBeenCalledTimes(missing === 'sell' ? 1 : 0);
            expect(services.store.getState().wallet.trading.lastLoadedTimestamp).toBe(
                cached.lastLoadedTimestamp,
            );
        },
    );

    it.each([
        { activeSection: 'sell', exchange: 0 },
        { activeSection: 'exchange', exchange: 1 },
    ] as const)(
        'explicit Retry in $activeSection refreshes its fresh entries, including empty fallback results',
        async ({ activeSection, exchange }) => {
            const { services } = await initLoadedTestServices();
            const timestamp = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(timestamp + 100);

            await services.store
                .dispatch(loadInitialDataThunk({ activeSection, forceReload: true }))
                .unwrap();

            expectCatalogCalls({ shared: 1, exchange });
            expect(services.store.getState().wallet.trading.lastLoadedTimestamp).toBe(Date.now());
            expect(selectExchangeCatalog(services).exchangeInfoLoadedTimestamp).toBe(
                exchange ? Date.now() : timestamp,
            );
        },
    );

    it.each(['first use', 'expiry', 'retry'] as const)(
        'loads all catalog resources in parallel on %s',
        async scenario => {
            const { services } =
                scenario === 'first use' ? initTestServices() : await initLoadedTestServices();
            const timestamp = services.store.getState().wallet.trading.lastLoadedTimestamp;
            if (scenario === 'expiry') {
                jest.spyOn(Date, 'now').mockReturnValue(timestamp + TRADE_API_RELOAD_DATA_AFTER_MS);
            }
            const pendingInfo = createDeferred<typeof info>();
            jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);

            const load = services.store.dispatch(
                loadInitialDataThunk({
                    activeSection: 'exchange',
                    forceReload: scenario === 'retry',
                }),
            );

            try {
                expectCatalogCalls({ shared: 1, exchange: 1 });
                expect(services.store.getState().wallet.trading).toMatchObject({
                    isLoading: true,
                    lastLoadedTimestamp: timestamp,
                });
            } finally {
                pendingInfo.resolve(info);
                await load.unwrap();
            }

            expect(services.store.getState().wallet.trading).toMatchObject({
                isLoading: false,
                lastLoadedTimestamp: Date.now(),
            });
        },
    );

    it('deduplicates the overlapping shared load but still loads the swap catalog, updating the latest section and API identity', async () => {
        const { services } = initTestServices();
        const pendingInfo = createDeferred<typeof info>();
        jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);
        const firstLoad = services.store.dispatch(loadInitialDataThunk({ activeSection: 'buy' }));
        services.store.dispatch(tradingExchangeActions.setTradingAccountKey(otherAccount.key));

        await services.store
            .dispatch(loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }))
            .unwrap();

        expect(services.store.getState().wallet.trading.isLoading).toBe(true);
        expect(services.store.getState().wallet.trading.activeSection).toBe('exchange');
        expect(tradeApi.setApiKey).toHaveBeenLastCalledWith(
            createSaltedTradeApiKey({
                descriptor: otherAccount.descriptor,
                salt: services.store.getState().wallet.trading.tradeApiInstallSalt ?? '',
            }),
        );
        expect(tradeApi.getInfo).toHaveBeenCalledTimes(1);
        expect(selectExchangeCatalog(services).exchangeInfoLoadedTimestamp).toBe(Date.now());
        pendingInfo.resolve(info);
        await firstLoad.unwrap();
        expectCatalogCalls({ shared: 1, exchange: 1 });
    });

    it('deduplicates overlapping swap catalog loads', async () => {
        const { services } = initTestServices();
        const pendingExchangeList = createDeferred<[]>();
        jest.mocked(tradeApi.getExchangeList).mockReturnValueOnce(pendingExchangeList.promise);

        const firstLoad = services.store.dispatch(
            loadInitialDataThunk({ activeSection: 'exchange' }),
        );
        const secondLoad = services.store.dispatch(
            loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }),
        );

        try {
            expect(selectExchangeCatalog(services).isExchangeInfoLoading).toBe(true);
            expect(services.store.getState().wallet.trading.isLoading).toBe(true);
        } finally {
            pendingExchangeList.resolve([]);
            await Promise.all([firstLoad.unwrap(), secondLoad.unwrap()]);
        }

        expect(tradeApi.getExchangeList).toHaveBeenCalledTimes(1);
        expect(selectExchangeCatalog(services)).toMatchObject({
            isExchangeInfoLoading: false,
            exchangeInfoLoadedTimestamp: Date.now(),
        });
    });

    it.each(['getInfo', 'getBuyList', 'getSellList'] as const)(
        'releases loading after an unexpected %s rejection without advancing freshness',
        async request => {
            const { services } = await initLoadedTestServices();
            const timestamp = services.store.getState().wallet.trading.lastLoadedTimestamp;
            jest.spyOn(Date, 'now').mockReturnValue(timestamp + 100);
            jest.mocked(tradeApi[request]).mockRejectedValueOnce(new Error('Unexpected failure'));

            await expect(
                services.store
                    .dispatch(loadInitialDataThunk({ activeSection: 'buy', forceReload: true }))
                    .unwrap(),
            ).rejects.toMatchObject({ message: 'Unexpected failure' });

            expect(services.store.getState().wallet.trading).toMatchObject({
                isLoading: false,
                lastLoadedTimestamp: timestamp,
            });
            await services.store
                .dispatch(loadInitialDataThunk({ activeSection: 'buy', forceReload: true }))
                .unwrap();
            expect(services.store.getState().wallet.trading.lastLoadedTimestamp).toBe(Date.now());
        },
    );

    it('releases swap catalog loading after an unexpected rejection without advancing freshness', async () => {
        const { services } = await initLoadedTestServices();
        const timestamp = selectExchangeCatalog(services).exchangeInfoLoadedTimestamp;
        jest.spyOn(Date, 'now').mockReturnValue(timestamp + 100);
        jest.mocked(tradeApi.getExchangeList).mockRejectedValueOnce(
            new Error('Unexpected failure'),
        );

        await expect(
            services.store
                .dispatch(loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }))
                .unwrap(),
        ).rejects.toMatchObject({ message: 'Unexpected failure' });

        expect(selectExchangeCatalog(services)).toMatchObject({
            isExchangeInfoLoading: false,
            exchangeInfoLoadedTimestamp: timestamp,
        });
        expect(services.store.getState().wallet.trading).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: Date.now(),
        });
        await services.store
            .dispatch(loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }))
            .unwrap();
        expect(selectExchangeCatalog(services).exchangeInfoLoadedTimestamp).toBe(Date.now());
    });

    it('refreshes the catalog after debug server invalidation', async () => {
        const { services } = await initLoadedTestServices();
        services.store.dispatch(tradingActions.invalidateCatalog());
        expect(services.store.getState().wallet.trading.lastLoadedTimestamp).toBe(0);
        expect(selectExchangeCatalog(services).exchangeInfoLoadedTimestamp).toBe(0);

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap();

        expectCatalogCalls({ shared: 1, exchange: 1 });
    });

    it('does not mark a load fresh if the debug server changes while it is running', async () => {
        const { services } = await initLoadedTestServices();
        const pendingInfo = createDeferred<typeof info>();
        jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);
        const load = services.store.dispatch(
            loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }),
        );
        services.store.dispatch(tradingActions.invalidateCatalog());
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue('https://staging-exchange.trezor.io');
        pendingInfo.resolve(info);
        await load.unwrap();

        expect(services.store.getState().wallet.trading).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
        expect(selectExchangeCatalog(services)).toMatchObject({
            isExchangeInfoLoading: false,
            exchangeInfoLoadedTimestamp: 0,
        });
    });

    it.each(['retry', 'expiry'] as const)(
        'keeps existing coins and platforms when getInfo fails during %s',
        async scenario => {
            const timestamp = Date.now();
            const { services } = initTestServices({
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

            await services.store
                .dispatch(
                    loadInitialDataThunk({
                        activeSection: 'buy',
                        forceReload: scenario === 'retry',
                    }),
                )
                .unwrap();

            expect(tradeApi.getInfo).toHaveBeenCalledTimes(1);
            expect(services.store.getState().wallet.trading.info.coins).toEqual(coinsFixture);
            expect(services.store.getState().wallet.trading.info.platforms).toEqual(
                platformsFixture,
            );
            expect(services.store.getActions().filter(tradingActions.saveInfo.match)).toHaveLength(
                0,
            );
        },
    );
});
