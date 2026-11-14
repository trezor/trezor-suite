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
import {
    TRADING_CATALOGS,
    TRADING_SECTION_CATALOGS,
    type TradingCatalog,
    getTradingCatalogStatus,
} from './tradingCatalogs';
import { mockTradingQueryClient } from '../../../mocks';
import coinsFixture from '../../__fixtures__/coins.json';
import platformsFixture from '../../__fixtures__/platforms.json';
import { TRADE_API_RELOAD_DATA_AFTER_MS, TRADING_ANONYMOUS_ID } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { tradingSellActions } from '../../reducers/sellReducer';
import { initialState, tradingActions } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradeApi } from '../../tradeApi';
import { type TradingType } from '../../types';
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

const initTestServices = () => {
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
            wallet: { trading: initialState },
        },
        services: () => ({
            getSelectedAccount,
            getTradingEnvironment: () => 'localhost',
            queryClient: mockTradingQueryClient(),
        }),
    });

    return { services, getSelectedAccount };
};

// The requests of every catalog, compared at once so that a failure names the catalog.
const expectCatalogCalls = (counts: Partial<Record<TradingCatalog, number>>) =>
    expect({
        info: jest.mocked(tradeApi.getInfo).mock.calls.length,
        buy: jest.mocked(tradeApi.getBuyList).mock.calls.length,
        sell: jest.mocked(tradeApi.getSellList).mock.calls.length,
        exchange: jest.mocked(tradeApi.getExchangeList).mock.calls.length,
    }).toEqual({ info: 0, buy: 0, sell: 0, exchange: 0, ...counts });

// Every catalog loaded, as after a visit of each section.
const initLoadedTestServices = async () => {
    const { services, getSelectedAccount } = initTestServices();
    await services.store
        .dispatch(loadInitialDataThunk({ activeSection: 'exchange', catalogs: TRADING_CATALOGS }))
        .unwrap();
    jest.clearAllMocks();

    return { services, getSelectedAccount };
};

type TestServices = ReturnType<typeof initTestServices>['services'];

const getCatalogStatus = (services: TestServices, catalogs: readonly TradingCatalog[]) =>
    getTradingCatalogStatus(services.queryClient, catalogs);

const getSectionCatalogStatus = (services: TestServices, section: TradingType) =>
    getCatalogStatus(services, TRADING_SECTION_CATALOGS[section]);

const getExchangeCatalog = (services: TestServices) => ({
    exchangeInfo: services.store.getState().wallet.trading.exchange.exchangeInfo,
    ...getCatalogStatus(services, ['exchange']),
});

// A macrotask lets every catalog load still in flight settle.
const settleCatalogLoads = () => new Promise(resolve => setTimeout(resolve, 0));

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

    it('loads the coin info and the sell catalog on first use of the sell section', async () => {
        const { services } = initTestServices();

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'sell' })).unwrap();

        expectCatalogCalls({ info: 1, sell: 1 });
        expect(getSectionCatalogStatus(services, 'sell')).toEqual({
            isLoading: false,
            lastLoadedTimestamp: Date.now(),
        });
        expect(services.store.getState().wallet.trading.buy.buyInfo).toBeUndefined();
        expect(getExchangeCatalog(services)).toEqual({
            exchangeInfo: undefined,
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
        expect(tradeApi.setServersEnvironment).toHaveBeenCalledWith('localhost');
        expect(tradeApi.createAnonymousApiKey).toHaveBeenCalledWith(TRADING_ANONYMOUS_ID);
        expect(tradeApi.setApiKey).not.toHaveBeenCalled();
    });

    it.each(['buy', 'sell', 'exchange'] as const)(
        'loads only the coin info and the catalog of the %s section',
        async activeSection => {
            const { services } = initTestServices();

            await services.store.dispatch(loadInitialDataThunk({ activeSection })).unwrap();

            expectCatalogCalls({ info: 1, [activeSection]: 1 });
            expect(services.store.getState().wallet.trading.activeSection).toBe(activeSection);
            expect(getSectionCatalogStatus(services, activeSection)).toEqual({
                isLoading: false,
                lastLoadedTimestamp: Date.now(),
            });
            expect(getExchangeCatalog(services).exchangeInfo).toEqual(
                activeSection === 'exchange'
                    ? { providerInfos: {}, buyCryptoIds: [], sellCryptoIds: [] }
                    : undefined,
            );
        },
    );

    it('loads only the requested catalogs, whatever the active section', async () => {
        const { services } = initTestServices();

        await services.store
            .dispatch(loadInitialDataThunk({ activeSection: 'exchange', catalogs: ['buy'] }))
            .unwrap();

        expectCatalogCalls({ buy: 1 });
        const { trading } = services.store.getState().wallet;
        expect(trading.activeSection).toBe('exchange');
        expect(trading.buy.buyInfo).toBeDefined();
        // Zero until the coin info loads too.
        expect(getSectionCatalogStatus(services, 'buy')).toEqual({
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
        expect(getExchangeCatalog(services)).toEqual({
            exchangeInfo: undefined,
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
    });

    it('reuses the buy catalog of the Buy buttons when a section opens', async () => {
        const { services } = initTestServices();
        await services.store
            .dispatch(loadInitialDataThunk({ activeSection: 'buy', catalogs: ['buy'] }))
            .unwrap();
        const { buyInfo } = services.store.getState().wallet.trading.buy;

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();

        expectCatalogCalls({ info: 1, buy: 1 });
        expect(getSectionCatalogStatus(services, 'buy')).toEqual({
            isLoading: false,
            lastLoadedTimestamp: Date.now(),
        });
        expect(services.store.getState().wallet.trading.buy.buyInfo).toBe(buyInfo);
    });

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
        expectCatalogCalls({ exchange: 1 });
        expect(getSectionCatalogStatus(services, 'buy').lastLoadedTimestamp).toBe(start);

        await loadAt(TRADE_API_RELOAD_DATA_AFTER_MS, 'buy');
        expectCatalogCalls({ info: 1, buy: 1 });

        await loadAt(TRADE_API_RELOAD_DATA_AFTER_MS + halfLife - 1, 'exchange');
        expectCatalogCalls({});

        await loadAt(TRADE_API_RELOAD_DATA_AFTER_MS + halfLife, 'exchange');
        expectCatalogCalls({ exchange: 1 });
        expect(getExchangeCatalog(services).lastLoadedTimestamp).toBe(Date.now());
    });

    it.each(['exchange', 'sell', 'buy'] as const)(
        'reuses the catalog, including empty fallbacks, when opening %s without accounts',
        async activeSection => {
            const { services } = await initLoadedTestServices();
            const loaded = services.store.getState().wallet.trading;
            const loadedStatus = getCatalogStatus(services, TRADING_CATALOGS);
            jest.spyOn(Date, 'now').mockReturnValue(loadedStatus.lastLoadedTimestamp + 1);

            await services.store.dispatch(loadInitialDataThunk({ activeSection })).unwrap();

            const reused = services.store.getState().wallet.trading;
            expect(reused.activeSection).toBe(activeSection);
            expectCatalogCalls({});
            expect(getCatalogStatus(services, TRADING_CATALOGS)).toEqual(loadedStatus);
            expect(reused.info).toBe(loaded.info);
            expect(reused.buy.buyInfo).toBe(loaded.buy.buyInfo);
            expect(reused.sell.sellInfo).toBe(loaded.sell.sellInfo);
            expect(reused.exchange.exchangeInfo).toBe(loaded.exchange.exchangeInfo);
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
            expectCatalogCalls({});
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
        expectCatalogCalls({});
    });

    it.each([
        TRADE_API_RELOAD_DATA_AFTER_MS - 1,
        TRADE_API_RELOAD_DATA_AFTER_MS,
        TRADE_API_RELOAD_DATA_AFTER_MS + 1,
    ])('honors the expiry boundary at an age of %i ms with populated cache entries', async age => {
        const { services } = await initLoadedTestServices();
        const timestamp = getCatalogStatus(services, TRADING_CATALOGS).lastLoadedTimestamp;
        jest.spyOn(Date, 'now').mockReturnValue(timestamp + age);

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap();

        const isExpired = age >= TRADE_API_RELOAD_DATA_AFTER_MS;
        expectCatalogCalls(isExpired ? { info: 1, exchange: 1 } : {});
        expect(getSectionCatalogStatus(services, 'exchange').lastLoadedTimestamp).toBe(
            isExpired ? Date.now() : timestamp,
        );
        // The catalogs of other sections wait for their readers.
        expect(getCatalogStatus(services, ['buy', 'sell']).lastLoadedTimestamp).toBe(timestamp);
    });

    it('keeps a catalog per server and restores the fresh one when switching back', async () => {
        const { services } = await initLoadedTestServices();
        const localhost = services.store.getState().wallet.trading;
        const localhostStatus = getCatalogStatus(services, TRADING_CATALOGS);
        jest.spyOn(Date, 'now').mockReturnValue(localhostStatus.lastLoadedTimestamp + 1);
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue('https://staging-exchange.trezor.io');
        jest.mocked(tradeApi.getInfo).mockResolvedValueOnce({ ...info, coins: coinsFixture });

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap();

        expectCatalogCalls({ info: 1, exchange: 1 });
        expect(getSectionCatalogStatus(services, 'exchange').lastLoadedTimestamp).toBe(Date.now());
        expect(services.store.getState().wallet.trading.info.coins).toEqual(coinsFixture);
        expect(services.store.getState().wallet.trading.exchange.exchangeInfo).not.toBe(
            localhost.exchange.exchangeInfo,
        );

        jest.clearAllMocks();
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue('http://localhost:3330');
        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap();

        const restored = services.store.getState().wallet.trading;
        expectCatalogCalls({});
        expect(restored.info.coins).toBe(localhost.info.coins);
        expect(restored.buy.buyInfo).toBe(localhost.buy.buyInfo);
        expect(restored.sell.sellInfo).toBe(localhost.sell.sellInfo);
        expect(restored.exchange.exchangeInfo).toBe(localhost.exchange.exchangeInfo);
        expect(getCatalogStatus(services, TRADING_CATALOGS)).toEqual(localhostStatus);
    });

    it.each(['sell', 'exchange'] as const)(
        'explicit Retry in %s refreshes its fresh entries, including empty fallback results',
        async activeSection => {
            const { services } = await initLoadedTestServices();
            const timestamp = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(timestamp + 100);

            await services.store
                .dispatch(loadInitialDataThunk({ activeSection, forceReload: true }))
                .unwrap();

            expectCatalogCalls({ info: 1, [activeSection]: 1 });
            expect(getSectionCatalogStatus(services, activeSection).lastLoadedTimestamp).toBe(
                Date.now(),
            );
            expect(getCatalogStatus(services, ['buy']).lastLoadedTimestamp).toBe(timestamp);
        },
    );

    it.each(['first use', 'expiry', 'retry'] as const)(
        'loads the catalogs of the section in parallel on %s',
        async scenario => {
            const { services } =
                scenario === 'first use' ? initTestServices() : await initLoadedTestServices();
            const timestamp = getSectionCatalogStatus(services, 'exchange').lastLoadedTimestamp;
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
                expectCatalogCalls({ info: 1, exchange: 1 });
                expect(getSectionCatalogStatus(services, 'exchange')).toEqual({
                    isLoading: true,
                    lastLoadedTimestamp: timestamp,
                });
            } finally {
                pendingInfo.resolve(info);
                await load.unwrap();
            }

            expect(getSectionCatalogStatus(services, 'exchange')).toEqual({
                isLoading: false,
                lastLoadedTimestamp: Date.now(),
            });
        },
    );

    it('joins the overlapping coin info load and still loads the swap catalog, updating the latest section and API identity', async () => {
        const { services } = initTestServices();
        const pendingInfo = createDeferred<typeof info>();
        jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);
        const firstLoad = services.store.dispatch(loadInitialDataThunk({ activeSection: 'buy' }));
        services.store.dispatch(tradingExchangeActions.setTradingAccountKey(otherAccount.key));

        const secondLoad = services.store.dispatch(
            loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }),
        );

        try {
            expectCatalogCalls({ info: 1, buy: 1, exchange: 1 });
            expect(services.store.getState().wallet.trading.activeSection).toBe('exchange');
            expect(getCatalogStatus(services, ['info']).isLoading).toBe(true);
        } finally {
            pendingInfo.resolve(info);
            await Promise.all([firstLoad.unwrap(), secondLoad.unwrap()]);
        }

        expect(tradeApi.setApiKey).toHaveBeenLastCalledWith(
            createSaltedTradeApiKey({
                descriptor: otherAccount.descriptor,
                salt: services.store.getState().wallet.trading.tradeApiInstallSalt ?? '',
            }),
        );
        expectCatalogCalls({ info: 1, buy: 1, exchange: 1 });
        expect(getCatalogStatus(services, ['info']).isLoading).toBe(false);
        expect(getExchangeCatalog(services).lastLoadedTimestamp).toBe(Date.now());
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
            expect(getExchangeCatalog(services).isLoading).toBe(true);
            expect(getCatalogStatus(services, ['info']).isLoading).toBe(true);
        } finally {
            pendingExchangeList.resolve([]);
            await Promise.all([firstLoad.unwrap(), secondLoad.unwrap()]);
        }

        expect(tradeApi.getExchangeList).toHaveBeenCalledTimes(1);
        expect(getExchangeCatalog(services)).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: Date.now(),
        });
    });

    it.each([
        { request: 'getInfo', catalog: 'info', activeSection: 'buy' },
        { request: 'getBuyList', catalog: 'buy', activeSection: 'buy' },
        { request: 'getSellList', catalog: 'sell', activeSection: 'sell' },
    ] as const)(
        'releases loading after an unexpected $request rejection without advancing freshness',
        async ({ request, catalog, activeSection }) => {
            const { services } = await initLoadedTestServices();
            const timestamp = getSectionCatalogStatus(services, activeSection).lastLoadedTimestamp;
            jest.spyOn(Date, 'now').mockReturnValue(timestamp + 100);
            jest.mocked(tradeApi[request]).mockRejectedValueOnce(new Error('Unexpected failure'));

            await expect(
                services.store
                    .dispatch(loadInitialDataThunk({ activeSection, forceReload: true }))
                    .unwrap(),
            ).rejects.toMatchObject({ message: 'Unexpected failure' });

            expect(getCatalogStatus(services, [catalog])).toEqual({
                isLoading: false,
                lastLoadedTimestamp: timestamp,
            });
            await settleCatalogLoads();
            expect(getSectionCatalogStatus(services, activeSection)).toEqual({
                isLoading: false,
                lastLoadedTimestamp: timestamp,
            });
            await services.store
                .dispatch(loadInitialDataThunk({ activeSection, forceReload: true }))
                .unwrap();
            expect(getSectionCatalogStatus(services, activeSection).lastLoadedTimestamp).toBe(
                Date.now(),
            );
        },
    );

    it('releases loading only once every catalog settles after one of them fails', async () => {
        const { services } = initTestServices();
        const pendingExchangeList = createDeferred<[]>();
        jest.mocked(tradeApi.getExchangeList).mockReturnValueOnce(pendingExchangeList.promise);
        jest.mocked(tradeApi.getInfo).mockRejectedValueOnce(new Error('Unexpected failure'));

        await expect(
            services.store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap(),
        ).rejects.toMatchObject({ message: 'Unexpected failure' });
        // The coin info settles while the swap catalog is still loading.
        await settleCatalogLoads();
        expect(getSectionCatalogStatus(services, 'exchange')).toEqual({
            isLoading: true,
            lastLoadedTimestamp: 0,
        });
        pendingExchangeList.resolve([]);
        await settleCatalogLoads();

        expect(getCatalogStatus(services, ['info'])).toEqual({
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
        expect(getExchangeCatalog(services)).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: Date.now(),
        });
    });

    it('releases swap catalog loading after an unexpected rejection without advancing freshness', async () => {
        const { services } = await initLoadedTestServices();
        const timestamp = getExchangeCatalog(services).lastLoadedTimestamp;
        jest.spyOn(Date, 'now').mockReturnValue(timestamp + 100);
        jest.mocked(tradeApi.getExchangeList).mockRejectedValueOnce(
            new Error('Unexpected failure'),
        );

        await expect(
            services.store
                .dispatch(loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }))
                .unwrap(),
        ).rejects.toMatchObject({ message: 'Unexpected failure' });

        expect(getExchangeCatalog(services)).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: timestamp,
        });
        await settleCatalogLoads();
        expect(getCatalogStatus(services, ['info'])).toEqual({
            isLoading: false,
            lastLoadedTimestamp: Date.now(),
        });
        await services.store
            .dispatch(loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }))
            .unwrap();
        expect(getExchangeCatalog(services).lastLoadedTimestamp).toBe(Date.now());
    });

    it('neither saves nor marks fresh a load that raced a debug server switch', async () => {
        const { services } = await initLoadedTestServices();
        const loaded = services.store.getState().wallet.trading;
        const pendingInfo = createDeferred<typeof info>();
        jest.mocked(tradeApi.getInfo).mockReturnValueOnce(pendingInfo.promise);
        const load = services.store.dispatch(
            loadInitialDataThunk({ activeSection: 'exchange', forceReload: true }),
        );
        jest.mocked(tradeApi.getApiServerUrl).mockReturnValue('https://staging-exchange.trezor.io');
        pendingInfo.resolve({ ...info, coins: coinsFixture });
        await load.unwrap();

        const raced = services.store.getState().wallet.trading;
        expect(getSectionCatalogStatus(services, 'exchange')).toEqual({
            isLoading: false,
            lastLoadedTimestamp: 0,
        });
        expect(raced.info.coins).toBe(loaded.info.coins);
        expect(raced.buy.buyInfo).toBe(loaded.buy.buyInfo);
        expect(raced.exchange.exchangeInfo).toBe(loaded.exchange.exchangeInfo);
        expect(getExchangeCatalog(services)).toMatchObject({
            isLoading: false,
            lastLoadedTimestamp: 0,
        });

        await services.store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap();

        expectCatalogCalls({ info: 2, exchange: 2 });
        expect(getSectionCatalogStatus(services, 'exchange').lastLoadedTimestamp).toBe(Date.now());
    });

    it.each(['retry', 'expiry'] as const)(
        'keeps existing coins and platforms when getInfo fails during %s',
        async scenario => {
            const { services } = initTestServices();
            jest.mocked(tradeApi.getInfo).mockResolvedValueOnce({
                ...info,
                coins: coinsFixture,
                platforms: platformsFixture,
            });
            await services.store.dispatch(loadInitialDataThunk({ activeSection: 'buy' })).unwrap();
            jest.mocked(tradeApi.getInfo).mockClear().mockResolvedValueOnce(undefined);
            if (scenario === 'expiry') {
                jest.spyOn(Date, 'now').mockReturnValue(
                    Date.now() + TRADE_API_RELOAD_DATA_AFTER_MS,
                );
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
                1,
            );
        },
    );
});
