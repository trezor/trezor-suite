import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Account } from '@suite-common/wallet-types';

import { buyThunks } from '../../';
import { accountBtc } from '../../../__fixtures__/utils';
import { invityAPI } from '../../../invityAPI';
import { tradingBuyActions } from '../../../reducers/buyReducer';
import {
    TradingState,
    initialState,
    prepareTradingReducer,
    tradingActions,
} from '../../../reducers/tradingReducer';
import { regional } from '../../../regional';
import { loadInitialDataThunk } from '../loadInitialDataThunk';

jest.mock('../../../invityAPI');
invityAPI.setInvityServersEnvironment = () => {};

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

type SelectedAccountStatus = {
    status: string;
    account: Account;
};
type SelectedAccountState = SelectedAccountStatus;
const mockedSelectedAccountReducer = createReducer<SelectedAccountState>(
    {
        status: 'none',
        account: accountBtc as Account,
    },
    () => {},
);

const mockedSuiteReducer = createReducer(
    {
        settings: {
            debug: {
                invityServerEnvironment: 'localhost',
            },
        },
    },
    () => {},
);

const initStore = (localInitialState?: Partial<TradingState>) =>
    configureMockStore({
        extra: {
            selectors: {
                ...extraDependenciesMock.selectors,
                selectSelectedAccount: () => ({ status: 'loaded', account: accountBtc }) as any,
            },
        },
        reducer: combineReducers({
            wallet: combineReducers({
                trading: tradingReducer,
                selectedAccount: mockedSelectedAccountReducer,
            }),
            suite: mockedSuiteReducer,
        }),
        preloadedState: {
            wallet: {
                trading: {
                    ...initialState,
                    ...localInitialState,
                },
            },
        },
    });

const testUpdatedInfoData = async (type: 'outdated' | 'account-changed') => {
    invityAPI.getCurrentAccountDescriptor = () =>
        type === 'account-changed' ? 'FakeDescriptor' : accountBtc.descriptor;
    invityAPI.getInfo = () =>
        Promise.resolve({
            coins: {},
            platforms: {},
        });

    const getCurrentAccountDescriptorMock = jest.spyOn(invityAPI, 'getCurrentAccountDescriptor');
    const setInvityServersEnvironmentMock = jest.spyOn(invityAPI, 'setInvityServersEnvironment');

    const mockedLastLoadedTimestamp = new Date().getTime();
    jest.spyOn(Date, 'now').mockImplementation(() => mockedLastLoadedTimestamp);

    const store = initStore({
        info: {
            paymentMethods: [],
        },
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

    expect(store.getActions()).toEqual([
        {
            payload: undefined,
            meta: {
                arg: {
                    activeSection: 'buy',
                },
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
            },
        },
        { type: buyThunks.loadInfoThunk.pending.type, payload: undefined },
        {
            type: buyThunks.loadInfoThunk.fulfilled.type,
            payload: mockBuyInfo,
        },
        {
            type: tradingBuyActions.saveBuyInfo.type,
            payload: mockBuyInfo,
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
            },
            type: `${loadInitialDataThunk.typePrefix}/fulfilled`,
        },
    ]);
    expect(getCurrentAccountDescriptorMock).toHaveBeenCalledTimes(1);
    expect(setInvityServersEnvironmentMock).toHaveBeenCalledTimes(1);
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
        invityAPI.getCurrentAccountDescriptor = () => accountBtc.descriptor;

        const getCurrentAccountDescriptorMock = jest.spyOn(
            invityAPI,
            'getCurrentAccountDescriptor',
        );
        const setInvityServersEnvironmentMock = jest.spyOn(
            invityAPI,
            'setInvityServersEnvironment',
        );

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
                },
                type: `${loadInitialDataThunk.typePrefix}/fulfilled`,
            },
        ]);
        expect(getCurrentAccountDescriptorMock).toHaveBeenCalledTimes(1);
        expect(setInvityServersEnvironmentMock).toHaveBeenCalledTimes(0);
    });

    it('should update active section', async () => {
        const store = initStore({
            lastLoadedTimestamp: Date.now(),
        });

        await store.dispatch(loadInitialDataThunk({ activeSection: 'exchange' }));

        expect(store.getState().wallet.trading.activeSection).toBe('exchange');
    });
});
