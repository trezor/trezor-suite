import { combineReducers } from '@reduxjs/toolkit';

import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import {
    confirmAddressOnDeviceThunk,
    prepareWalletSettingsReducer,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { tradingThunks } from '../';
import { accounts } from '../../../reducers/__fixtures__/account';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import type { LogErrorThunkProps } from '../logErrorThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);
const walletSettingsReducer = prepareWalletSettingsReducer(extraDependenciesCommonMock);

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: jest.fn(),
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    confirmAddressOnDeviceThunk: jest.fn(),
}));

jest.mock('../../common/logErrorThunk', () => ({
    logErrorThunk: (props: LogErrorThunkProps) => ({
        type: 'mockedLogErrorThunk',
        payload: props,
    }),
}));

describe('verifyAddressThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should save verified address', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    settings: walletSettingsReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: initialState,
                },
            },
        });

        const account = accounts[0];
        const addressData = account.addresses?.unused[0];
        const verifiedAddress = {
            address: addressData?.address,
            mac: 'mockedMac',
            path: "m/84'/0'/0'/0/5",
        };

        (selectSelectedDevice as jest.Mock).mockImplementation(() => ({
            connected: true,
            available: true,
            useEmptyPassphrase: true,
        }));

        (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
            createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                success: true,
                payload: verifiedAddress,
            })),
        );

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData?.address,
                path: addressData?.path,
            }),
        );

        expect(store.getActions().length).toEqual(7);
        expect(store.getState().wallet.trading.verifiedAddress).toEqual(verifiedAddress);
    });

    it('should not update verified address device not found', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    settings: walletSettingsReducer,
                }),
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
            }),
        );

        expect(store.getActions().length).toEqual(2);
        expect(store.getState().wallet.trading.verifiedAddress).toEqual(undefined);
    });

    it('should not update verified address when path or address are not defined', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    settings: walletSettingsReducer,
                }),
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
            }),
        );

        expect(store.getActions().length).toEqual(2);
        expect(store.getState().wallet.trading.verifiedAddress).toEqual(undefined);
    });

    it('should not update verified address, but trigger toast when device is not available', async () => {
        const store = configureMockStore({
            extra: extraDependenciesCommonMock,
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    settings: walletSettingsReducer,
                }),
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
            }),
        );

        const actionModal = store
            .getActions()
            .find(action => action.type === extraDependenciesCommonMock.actions.openModal.type);

        expect(actionModal).toEqual({
            type: extraDependenciesCommonMock.actions.openModal.type,
            payload: {
                type: 'unverified-address-proceed',
                value: addressData?.address,
            },
        });
        expect(store.getState().wallet.trading.verifiedAddress).toEqual(undefined);
    });

    it('should not update verified address, but trigger toast when device is not connected', async () => {
        const store = configureMockStore({
            extra: extraDependenciesCommonMock,
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    settings: walletSettingsReducer,
                }),
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
            }),
        );

        const actionModal = store
            .getActions()
            .find(action => action.type === extraDependenciesCommonMock.actions.openModal.type);

        expect(actionModal).toEqual({
            type: extraDependenciesCommonMock.actions.openModal.type,
            payload: {
                type: 'unverified-address-proceed',
                value: addressData?.address,
            },
        });
        expect(store.getState().wallet.trading.verifiedAddress).toEqual(undefined);
    });

    it('should not update verified address when a confirmation of address on device is not successful (no permission)', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    settings: walletSettingsReducer,
                }),
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
                success: false,
                error: {
                    code: 'Method_PermissionsNotGranted',
                },
            })),
        );

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData?.address,
                path: addressData?.path,
            }),
        );

        expect(store.getState().wallet.trading.verifiedAddress).toEqual(undefined);
    });

    it('should not update verified address when a confirmation of address on device is not successful', async () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    settings: walletSettingsReducer,
                }),
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
                error: {
                    message: error,
                    code: 'error-code',
                },
            })),
        );

        await store.dispatch(
            tradingThunks.verifyAddressThunk({
                account,
                address: addressData?.address,
                path: addressData?.path,
            }),
        );

        const actionToast = store
            .getActions()
            .find(action => action.type === 'mockedLogErrorThunk');

        expect(actionToast?.payload).toEqual({
            tradingType: 'buy',
            toastType: 'verify-address-error',
            errorMessage: error,
        });

        expect(store.getState().wallet.trading.verifiedAddress).toEqual(undefined);
    });
});
