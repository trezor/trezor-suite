import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { prepareAccountsReducer } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { loadInitialDataThunk } from './loadInitialDataThunk';
import { accountBtc, accountEth } from '../../__fixtures__/utils';
import { TRADING_FALLBACK_API_KEY } from '../../constants';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { exchangeInitialState, tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type SellInfo, tradingSellActions } from '../../reducers/sellReducer';
import {
    type TradingState,
    initialState,
    tradingActions,
} from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { regional } from '../../regional';
import { tradeApi } from '../../tradeApi';
import { buyThunks } from '../buy';
import { exchangeThunks } from '../exchange';
import { sellThunks } from '../sell';

jest.mock('../../tradeApi');
tradeApi.setServersEnvironment = () => {};

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

type SelectedAccountStatus = {
    status: string;
    account: Account | undefined;
};
type SelectedAccountState = SelectedAccountStatus;
const mockedSelectedAccountReducer = createReducer<SelectedAccountState>(
    {
        status: 'none',
        account: accountBtc as Account,
    },
    () => {},
);

const mockedAccountReducer = prepareAccountsReducer(extraDependenciesCommonMock);

const mockedSuiteReducer = createReducer(
    {
        settings: {
            debug: {
                tradeServerEnvironment: 'localhost',
            },
        },
    },
    () => {},
);

const initStore = (
    localInitialState?: Partial<TradingState>,
    selectedAccount: SelectedAccountStatus = { status: 'loaded', account: accountBtc as Account },
) =>
    configureMockStore({
        extra: {
            selectors: {
                ...extraDependenciesCommonMock.selectors,
                selectSelectedAccount: () => selectedAccount as any,
            },
        },
        reducer: combineReducers({
            wallet: combineReducers({
                trading: tradingReducer,
                selectedAccount: mockedSelectedAccountReducer,
                accounts: mockedAccountReducer,
            }),
            suite: mockedSuiteReducer,
        }),
        preloadedState: {
            wallet: {
                trading: {
                    ...initialState,
                    ...localInitialState,
                },
                accounts: [accountEth],
            },
        },
    });

const testUpdatedInfoData = async (type: 'outdated' | 'account-changed') => {
    tradeApi.getCurrentAccountDescriptor = () =>
        type === 'account-changed' ? 'FakeDescriptor' : accountBtc.descriptor;
    tradeApi.getInfo = () =>
        Promise.resolve({
            coins: {},
            platforms: {},
            config: {},
        });

    const getCurrentAccountDescriptorMock = jest.spyOn(tradeApi, 'getCurrentAccountDescriptor');
    const setServersEnvironmentMock = jest.spyOn(tradeApi, 'setServersEnvironment');

    const mockedLastLoadedTimestamp = new Date().getTime();
    jest.spyOn(Date, 'now').mockImplementation(() => mockedLastLoadedTimestamp);

    const store = initStore({
        info: {},
        lastLoadedTimestamp: type === 'outdated' ? 0 : mockedLastLoadedTimestamp,
    });

    await store.dispatch(loadInitialDataThunk({ activeSection: 'buy' }));

    const mockBuyInfo = {
        buyInfo: {
            country: regional.UNKNOWN_COUNTRY,
            providers: [],
            defaultAmountsOfFiatCurrencies: {},
        },
        providerInfos: {},
        supportedFiatCurrencies: [],
        supportedCryptoCurrencies: [],
    };

    const mockExchangeInfo = {
        providerInfos: {},
        buyCryptoIds: [],
        sellCryptoIds: [],
    };

    const mockSellInfo: SellInfo = {
        providerInfos: {},
        supportedCryptoCurrencies: [],
        supportedFiatCurrencies: [],
        country: regional.UNKNOWN_COUNTRY,
    };

    expect(store.getActions()).toEqual([
        {
            payload: undefined,
            meta: {
                arg: {
                    activeSection: 'buy',
                },
                requestId: expect.any(String),
                requestStatus: 'pending',
            },
            type: `${loadInitialDataThunk.typePrefix}/pending`,
        },
        {
            payload: 'buy',
            type: tradingActions.setTradingActiveSection.type,
        },
        {
            type: tradingActions.setLoading.type,
            payload: {
                isLoading: true,
            },
        },
        {
            type: tradingActions.saveInfo.type,
            payload: {
                coins: {},
                platforms: {},
                config: {},
            },
        },
        {
            type: buyThunks.loadInfoThunk.pending.type,
            payload: undefined,
            meta: {
                arg: undefined,
                requestId: expect.any(String),
                requestStatus: 'pending',
            },
        },
        {
            type: buyThunks.loadInfoThunk.fulfilled.type,
            payload: mockBuyInfo,
            meta: {
                arg: undefined,
                requestId: expect.any(String),
                requestStatus: 'fulfilled',
            },
        },
        {
            type: tradingBuyActions.saveBuyInfo.type,
            payload: mockBuyInfo,
        },
        {
            type: exchangeThunks.loadInfoThunk.pending.type,
            payload: undefined,
            meta: {
                arg: undefined,
                requestId: expect.any(String),
                requestStatus: 'pending',
            },
        },
        {
            type: exchangeThunks.loadInfoThunk.fulfilled.type,
            payload: mockExchangeInfo,
            meta: {
                arg: undefined,
                requestId: expect.any(String),
                requestStatus: 'fulfilled',
            },
        },
        {
            type: tradingExchangeActions.saveExchangeInfo.type,
            payload: mockExchangeInfo,
        },
        {
            type: sellThunks.loadInfoThunk.pending.type,
            payload: undefined,
            meta: {
                arg: undefined,
                requestId: expect.any(String),
                requestStatus: 'pending',
            },
        },
        {
            type: sellThunks.loadInfoThunk.fulfilled.type,
            payload: mockSellInfo,
            meta: {
                arg: undefined,
                requestId: expect.any(String),
                requestStatus: 'fulfilled',
            },
        },
        {
            type: tradingSellActions.saveSellInfo.type,
            payload: mockSellInfo,
        },
        {
            payload: {
                isLoading: false,
                lastLoadedTimestamp: mockedLastLoadedTimestamp,
            },
            type: tradingActions.setLoading.type,
        },
        {
            payload: undefined,
            meta: {
                arg: {
                    activeSection: 'buy',
                },
                requestId: expect.any(String),
                requestStatus: 'fulfilled',
            },
            type: `${loadInitialDataThunk.typePrefix}/fulfilled`,
        },
    ]);
    expect(getCurrentAccountDescriptorMock).toHaveBeenCalledTimes(1);
    expect(setServersEnvironmentMock).toHaveBeenCalledTimes(1);
};

describe('loadInitialDataThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should update when account is changed', async () => {
        await testUpdatedInfoData('account-changed');
    });

    it('should update when data are outdated data ', async () => {
        await testUpdatedInfoData('outdated');
    });

    it('should keep same version of data without update', async () => {
        tradeApi.getCurrentAccountDescriptor = () => accountBtc.descriptor;

        const getCurrentAccountDescriptorMock = jest.spyOn(tradeApi, 'getCurrentAccountDescriptor');
        const setServersEnvironmentMock = jest.spyOn(tradeApi, 'setServersEnvironment');

        const store = initStore({
            lastLoadedTimestamp: Date.now(),
        });

        await store.dispatch(loadInitialDataThunk({ activeSection: 'buy' }));
        expect(store.getActions()).toEqual([
            {
                payload: undefined,
                meta: {
                    arg: {
                        activeSection: 'buy',
                    },
                    requestId: expect.any(String),
                    requestStatus: 'pending',
                },
                type: `${loadInitialDataThunk.typePrefix}/pending`,
            },
            {
                payload: 'buy',
                type: tradingActions.setTradingActiveSection.type,
            },
            {
                payload: undefined,
                meta: {
                    arg: {
                        activeSection: 'buy',
                    },
                    requestId: expect.any(String),
                    requestStatus: 'fulfilled',
                },
                type: `${loadInitialDataThunk.typePrefix}/fulfilled`,
            },
        ]);
        expect(getCurrentAccountDescriptorMock).toHaveBeenCalledTimes(1);
        expect(setServersEnvironmentMock).toHaveBeenCalledTimes(0);
    });

    it('should reload with the fallback api key when the account disconnects while cached data is fresh', async () => {
        tradeApi.getCurrentAccountDescriptor = () => accountBtc.descriptor;
        tradeApi.getInfo = () =>
            Promise.resolve({
                coins: {},
                platforms: {},
                config: {},
            });

        const createApiKeyMock = jest.spyOn(tradeApi, 'createApiKey');

        const mockedLastLoadedTimestamp = new Date().getTime();
        jest.spyOn(Date, 'now').mockImplementation(() => mockedLastLoadedTimestamp);

        const store = initStore(
            { info: {}, lastLoadedTimestamp: mockedLastLoadedTimestamp },
            { status: 'none', account: undefined },
        );

        await store.dispatch(loadInitialDataThunk({ activeSection: 'buy' }));

        const dispatchedTypes = store.getActions().map(action => action.type);
        expect(dispatchedTypes).toContain(tradingActions.setLoading.type);
        expect(createApiKeyMock).toHaveBeenCalledWith(TRADING_FALLBACK_API_KEY);
    });

    it('should update active section', async () => {
        const store = initStore({
            lastLoadedTimestamp: Date.now(),
            exchange: {
                ...exchangeInitialState,
                tradingAccountKey: accountEth.key,
            },
        });

        await store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' })).unwrap();

        expect(store.getState().wallet.trading.activeSection).toBe('exchange');
    });
});
