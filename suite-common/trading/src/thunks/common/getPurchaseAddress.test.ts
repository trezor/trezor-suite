import { combineReducers } from '@reduxjs/toolkit';

import { deviceInitialState } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore } from '@suite-common/test-utils';
import {
    confirmAddressOnDeviceThunk,
    prepareWalletSettingsReducer,
} from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';

import { getPurchaseAddressThunk } from './getPurchaseAddress';
import { accounts } from '../../reducers/__fixtures__/account';
import { initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const walletSettingsReducer = prepareWalletSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
});

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    confirmAddressOnDeviceThunk: jest.fn(),
}));

const baseAccount = accounts[0];
if (!baseAccount) throw new Error('Missing test fixture');
const mockAccount: Account = {
    ...baseAccount,
    addresses: {
        change: [],
        used: [],
        unused: [
            {
                address: 'tb1qvanxty2svhps2xged5n4kvm2k2zctpv9ws2grd',
                path: "m/84'/1'/0'/0/0",
                transfers: 0,
                balance: '0',
                received: '0',
                sent: '0',
            },
        ],
    },
};

describe('getPurchaseAddress thunk', () => {
    const mockAddress = 'tb1qvanxty2svhps2xged5n4kvm2k2zctpv9ws2grd';
    const mockPath = "m/84'/1'/0'/0/0";
    const mockMac = 'test-mac-purchase-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createMockStore = (preloadedState = {}) =>
        createTestStore({
            extra: undefined,
            reducer: combineReducers({
                device: () => deviceInitialState,
                wallet: combineReducers({
                    accounts: () => accounts,
                    settings: walletSettingsReducer,
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        ...preloadedState,
                    },
                },
            },
        });

    describe('successful address confirmation', () => {
        it('should successfully get purchase address and MAC', async () => {
            (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
                createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                    success: true,
                    payload: {
                        address: mockAddress,
                        mac: mockMac,
                    },
                })),
            );

            const store = createMockStore();
            const result = await store.dispatch(
                getPurchaseAddressThunk({ account: mockAccount, address: mockAddress }),
            );

            expect(result.type).toBe(getPurchaseAddressThunk.fulfilled.type);
            expect(result.payload).toEqual({
                address: mockAddress,
                mac: mockMac,
                path: mockPath,
            });

            // Verify confirmAddressOnDeviceThunk was called with correct parameters
            expect(confirmAddressOnDeviceThunk).toHaveBeenCalledWith({
                accountKey: mockAccount.key,
                addressPath: mockPath,
                chunkify: true, // AddressDisplayOptions.CHUNKED
                showOnTrezor: false,
            });
        });

        it('should handle non-chunked address display', async () => {
            // @ts-expect-error - Mock implementation for testing
            confirmAddressOnDeviceThunk.mockImplementation(
                createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                    success: true,
                    payload: {
                        address: mockAddress,
                        mac: mockMac,
                    },
                })),
            );

            const storeWithNonChunked = createTestStore({
                extra: undefined,
                reducer: combineReducers({
                    device: () => deviceInitialState,
                    wallet: combineReducers({
                        accounts: () => accounts,
                        settings: walletSettingsReducer,
                        trading: tradingReducer,
                    }),
                }),
                preloadedState: {
                    wallet: {
                        settings: { addressDisplayType: AddressDisplayOptions.ORIGINAL },
                        trading: initialState,
                    },
                },
            });

            const result = await storeWithNonChunked.dispatch(
                getPurchaseAddressThunk({ account: mockAccount, address: mockAddress }),
            );

            expect(result.type).toBe(getPurchaseAddressThunk.fulfilled.type);
            expect(confirmAddressOnDeviceThunk).toHaveBeenCalledWith({
                accountKey: mockAccount.key,
                addressPath: mockPath,
                chunkify: false, // AddressDisplayOptions.ORIGINAL
                showOnTrezor: false,
            });
        });
    });

    describe('error handling', () => {
        it('should reject when address is not in account', async () => {
            const store = createMockStore();
            const result = await store.dispatch(
                getPurchaseAddressThunk({ account: mockAccount, address: 'non-existent-address' }),
            );

            expect(result.type).toBe(getPurchaseAddressThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });

            // Verify confirmAddressOnDeviceThunk was not called
            expect(confirmAddressOnDeviceThunk).not.toHaveBeenCalled();
        });

        it('should reject when confirmAddressOnDeviceThunk fails', async () => {
            (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
                createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                    success: false,
                    error: { message: 'Device confirmation failed' },
                })),
            );

            const store = createMockStore();
            const result = await store.dispatch(
                getPurchaseAddressThunk({ account: mockAccount, address: mockAddress }),
            );

            expect(result.type).toBe(getPurchaseAddressThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        });

        it('should reject when MAC is missing from response', async () => {
            (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
                createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                    success: true,
                    payload: {
                        address: mockAddress,
                        // mac is missing
                    },
                })),
            );

            const store = createMockStore();
            const result = await store.dispatch(
                getPurchaseAddressThunk({ account: mockAccount, address: mockAddress }),
            );

            expect(result.type).toBe(getPurchaseAddressThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        });
    });

    describe('thunk metadata', () => {
        it('should have correct thunk type prefix', () => {
            expect(getPurchaseAddressThunk.typePrefix).toBe('@trading/thunk/getPurchaseAddress');
        });
    });
});
