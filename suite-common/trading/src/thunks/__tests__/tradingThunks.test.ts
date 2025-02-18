import { combineReducers } from '@reduxjs/toolkit';

import { createReducerWithExtraDeps, createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { confirmAddressOnDeviceThunk, selectSelectedDevice } from '@suite-common/wallet-core';
import { Account, AddressDisplayOptions } from '@suite-common/wallet-types';

import { accounts } from '../../reducers/__fixtures__/account';
import { tradingBuyActions } from '../../reducers/buyReducer';
import { initialState, prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradingThunks } from '../tradingThunks';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);
const mockedSuiteReducer = createReducerWithExtraDeps(
    {
        settings: {
            addressDisplayType: AddressDisplayOptions.CHUNKED,
        },
    },
    () => {},
);

jest.mock('@suite-common/wallet-core', () => ({
    confirmAddressOnDeviceThunk: jest.fn(),
    selectSelectedDevice: jest.fn(),
}));

describe('Testing trading thunks', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('testing verifyAddressThunk - save verified address', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
                suite: mockedSuiteReducer(extraDependenciesMock),
            }),
            preloadedState: {
                wallet: {
                    trading: initialState,
                },
            },
        });

        const account = accounts[0];
        const addressData = account.addresses?.unused[0];

        (selectSelectedDevice as jest.Mock).mockImplementation(() => ({
            connected: true,
            available: true,
            useEmptyPassphrase: true,
        }));

        (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
            createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                success: true,
            })),
        );

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData?.address,
                path: addressData?.path,
                tradingAction: tradingBuyActions.verifyAddress.type,
            }),
        );

        expect(store.getActions().length).toEqual(6);
        expect(store.getState().wallet.trading.buy.addressVerified).toEqual(addressData?.address);
    });

    it('testing verifyAddressThunk - device not found', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
                suite: mockedSuiteReducer(extraDependenciesMock),
            }),
            preloadedState: {
                wallet: {
                    trading: initialState,
                },
            },
        });

        const account = accounts[0];
        const addressData = account.addresses?.unused[0];

        (selectSelectedDevice as jest.Mock).mockImplementation(() => undefined);

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData?.address,
                path: addressData?.path,
                tradingAction: tradingBuyActions.verifyAddress.type,
            }),
        );

        expect(store.getActions().length).toEqual(2);
        expect(store.getState().wallet.trading.buy.addressVerified).toEqual(undefined);
    });

    it('testing verifyAddressThunk - path or address not defined', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
                suite: mockedSuiteReducer(extraDependenciesMock),
            }),
            preloadedState: {
                wallet: {
                    trading: initialState,
                },
            },
        });

        const account = {
            ...accounts[0],
            addresses: {
                unused: [],
            },
        } as unknown as Account;
        const addressData = undefined;

        (selectSelectedDevice as jest.Mock).mockImplementation(() => ({
            connected: true,
            available: true,
            useEmptyPassphrase: true,
        }));

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData,
                path: addressData,
                tradingAction: tradingBuyActions.verifyAddress.type,
            }),
        );

        expect(store.getActions().length).toEqual(2);
        expect(store.getState().wallet.trading.buy.addressVerified).toEqual(undefined);
    });

    it('testing verifyAddressThunk - device is not available', async () => {
        const store = configureMockStore({
            extra: extraDependenciesMock,
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
                suite: mockedSuiteReducer(extraDependenciesMock),
            }),
            preloadedState: {
                wallet: {
                    trading: initialState,
                },
            },
        });

        const account = accounts[0];
        const addressData = account.addresses?.unused[0];

        (selectSelectedDevice as jest.Mock).mockImplementation(() => ({
            connected: true,
            available: false,
            useEmptyPassphrase: true,
        }));

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData?.address,
                path: addressData?.path,
                tradingAction: tradingBuyActions.verifyAddress.type,
            }),
        );

        const actionModal = store
            .getActions()
            .find(action => action.type === extraDependenciesMock.actions.openModal.type);

        expect(actionModal).toEqual({
            type: extraDependenciesMock.actions.openModal.type,
            payload: {
                type: 'unverified-address-proceed',
                value: addressData?.address,
            },
        });
        expect(store.getState().wallet.trading.buy.addressVerified).toEqual(undefined);
    });

    it('testing verifyAddressThunk - device is not connected', async () => {
        const store = configureMockStore({
            extra: extraDependenciesMock,
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
                suite: mockedSuiteReducer(extraDependenciesMock),
            }),
            preloadedState: {
                wallet: {
                    trading: initialState,
                },
            },
        });

        const account = accounts[0];
        const addressData = account.addresses?.unused[0];

        (selectSelectedDevice as jest.Mock).mockImplementation(() => ({
            connected: false,
            available: true,
            useEmptyPassphrase: true,
        }));

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData?.address,
                path: addressData?.path,
                tradingAction: tradingBuyActions.verifyAddress.type,
            }),
        );

        const actionModal = store
            .getActions()
            .find(action => action.type === extraDependenciesMock.actions.openModal.type);

        expect(actionModal).toEqual({
            type: extraDependenciesMock.actions.openModal.type,
            payload: {
                type: 'unverified-address-proceed',
                value: addressData?.address,
            },
        });
        expect(store.getState().wallet.trading.buy.addressVerified).toEqual(undefined);
    });

    it('testing verifyAddressThunk - a confirmation of address on  device is not successful', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
                suite: mockedSuiteReducer(extraDependenciesMock),
            }),
            preloadedState: {
                wallet: {
                    trading: initialState,
                },
            },
        });

        const account = accounts[0];
        const addressData = account.addresses?.unused[0];

        (selectSelectedDevice as jest.Mock).mockImplementation(() => ({
            connected: true,
            available: true,
            useEmptyPassphrase: true,
        }));

        const error = 'error message';
        (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
            createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                success: false,
                payload: {
                    error,
                    code: 'error-code',
                },
            })),
        );

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData?.address,
                path: addressData?.path,
                tradingAction: tradingBuyActions.verifyAddress.type,
            }),
        );

        const actionToast = store
            .getActions()
            .find(action => action.type === '@common/in-app-notifications/addToast');

        expect(actionToast?.type).toEqual('@common/in-app-notifications/addToast');
        expect(actionToast?.payload?.type).toEqual('verify-address-error');
        expect(actionToast?.payload?.error).toEqual(error);

        expect(store.getState().wallet.trading.buy.addressVerified).toEqual(undefined);
    });
});
