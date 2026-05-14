import { combineReducers } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import {
    confirmAddressOnDeviceThunk,
    prepareWalletSettingsReducer,
} from '@suite-common/wallet-core';
import { type Account, AddressDisplayOptions } from '@suite-common/wallet-types';

import { accounts } from '../../../reducers/__fixtures__/account';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { getRefundAddress } from '../getRefundAddress';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);
const walletSettingsReducer = prepareWalletSettingsReducer(extraDependenciesCommonMock);

// Mock external dependencies
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    confirmAddressOnDeviceThunk: jest.fn(),
}));

jest.mock('../../../utils', () => ({
    getUnusedAddressFromAccount: jest.fn(),
}));

const { getUnusedAddressFromAccount } = require('../../../utils');

describe('getRefundAddress thunk', () => {
    const mockAccount: Account = accounts[0];

    const mockPath = "m/84'/0'/0'/0/5";
    const mockAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
    const mockMac = 'test-mac-refund-123';

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock for getUnusedAddressFromAccount
        (getUnusedAddressFromAccount as jest.Mock).mockReturnValue({
            path: mockPath,
            address: mockAddress,
        });
    });

    const createMockStore = (preloadedState = {}) =>
        configureMockStore({
            extra: extraDependenciesCommonMock,
            reducer: combineReducers({
                wallet: combineReducers({
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
        it('should successfully get refund address and MAC', async () => {
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
            const result = await store.dispatch(getRefundAddress({ account: mockAccount }));

            expect(result.type).toBe(getRefundAddress.fulfilled.type);
            expect(result.payload).toEqual({
                address: mockAddress,
                mac: mockMac,
                path: "m/84'/0'/0'/0/5",
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

            const storeWithNonChunked = configureMockStore({
                extra: extraDependenciesCommonMock,
                reducer: combineReducers({
                    wallet: combineReducers({
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
                getRefundAddress({ account: mockAccount }),
            );

            expect(result.type).toBe(getRefundAddress.fulfilled.type);
            expect(confirmAddressOnDeviceThunk).toHaveBeenCalledWith({
                accountKey: mockAccount.key,
                addressPath: mockPath,
                chunkify: false, // AddressDisplayOptions.ORIGINAL
                showOnTrezor: false,
            });
        });
    });

    describe('error handling', () => {
        it('should reject when path is not available', async () => {
            (getUnusedAddressFromAccount as jest.Mock).mockReturnValue({
                path: null,
                address: mockAddress,
            });

            const store = createMockStore();
            const result = await store.dispatch(getRefundAddress({ account: mockAccount }));

            expect(result.type).toBe(getRefundAddress.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });

            // Verify confirmAddressOnDeviceThunk was not called
            expect(confirmAddressOnDeviceThunk).not.toHaveBeenCalled();
        });

        it('should reject when path is undefined', async () => {
            (getUnusedAddressFromAccount as jest.Mock).mockReturnValue({
                path: undefined,
                address: mockAddress,
            });

            const store = createMockStore();
            const result = await store.dispatch(getRefundAddress({ account: mockAccount }));

            expect(result.type).toBe(getRefundAddress.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        });

        it('should reject when confirmAddressOnDeviceThunk errors', async () => {
            (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
                createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                    success: false,
                    error: { message: 'Device confirmation failed' },
                })),
            );

            const store = createMockStore();
            const result = await store.dispatch(getRefundAddress({ account: mockAccount }));

            expect(result.type).toBe(getRefundAddress.rejected.type);
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
            const result = await store.dispatch(getRefundAddress({ account: mockAccount }));

            expect(result.type).toBe(getRefundAddress.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        });

        it('should reject when MAC is empty string', async () => {
            (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
                createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                    success: true,
                    payload: {
                        address: mockAddress,
                        mac: '',
                    },
                })),
            );

            const store = createMockStore();
            const result = await store.dispatch(getRefundAddress({ account: mockAccount }));

            expect(result.type).toBe(getRefundAddress.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_VERIFY_ERROR',
                },
            });
        });
    });

    describe('edge cases', () => {
        it('should handle different account types', async () => {
            const segwitAccount = {
                ...mockAccount,
                accountType: 'segwit',
            } as Account;

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
            const result = await store.dispatch(getRefundAddress({ account: segwitAccount }));

            expect(result.type).toBe(getRefundAddress.fulfilled.type);
            expect(result.payload).toEqual({
                address: mockAddress,
                mac: mockMac,
                path: "m/84'/0'/0'/0/5",
            });
        });

        it('should handle different path formats', async () => {
            const tapRootPath = [44 | 0x80000000, 0 | 0x80000000, 0 | 0x80000000, 1, 5];

            (getUnusedAddressFromAccount as jest.Mock).mockReturnValue({
                path: tapRootPath,
                address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
            });

            (confirmAddressOnDeviceThunk as unknown as jest.Mock).mockImplementation(
                createThunk('@suite/device/confirmAddressOnDeviceThunk', () => ({
                    success: true,
                    payload: {
                        address: 'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                        mac: 'taproot-mac-123',
                    },
                })),
            );

            const store = createMockStore();
            const result = await store.dispatch(getRefundAddress({ account: mockAccount }));

            expect(result.type).toBe(getRefundAddress.fulfilled.type);
            expect(confirmAddressOnDeviceThunk).toHaveBeenCalledWith({
                accountKey: mockAccount.key,
                addressPath: tapRootPath,
                chunkify: true,
                showOnTrezor: false,
            });
        });
    });

    describe('thunk metadata', () => {
        it('should have correct thunk type prefix', () => {
            expect(getRefundAddress.typePrefix).toBe('@trading/thunk/getRefundAddress');
        });

        it('should handle pending state correctly', async () => {
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
            const promise = store.dispatch(getRefundAddress({ account: mockAccount }));

            // Check if the action is in pending state
            const actions = store.getActions();
            expect(actions[0].type).toBe(getRefundAddress.pending.type);

            const result = await promise;
            expect(result.type).toBe(getRefundAddress.fulfilled.type);
        });
    });
});
