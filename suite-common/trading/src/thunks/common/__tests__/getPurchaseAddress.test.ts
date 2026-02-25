import { combineReducers } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { confirmAddressOnDeviceThunk } from '@suite-common/wallet-core';
import { Account, AddressDisplayOptions } from '@suite-common/wallet-types';

import { accounts } from '../../../reducers/__fixtures__/account';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { getPurchaseAddress } from '../getPurchaseAddress';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    confirmAddressOnDeviceThunk: jest.fn(),
}));

const mockAccount: Account = {
    ...accounts[0],
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
        configureMockStore({
            extra: {
                ...extraDependenciesCommonMock,
                selectors: {
                    selectAddressDisplayType: jest
                        .fn()
                        .mockReturnValue(AddressDisplayOptions.CHUNKED),
                },
            },
            reducer: combineReducers({
                wallet: combineReducers({
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
                getPurchaseAddress({ account: mockAccount, address: mockAddress }),
            );

            expect(result.type).toBe(getPurchaseAddress.fulfilled.type);
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

            const storeWithNonChunked = configureMockStore({
                extra: {
                    ...extraDependenciesCommonMock,
                    selectors: {
                        selectAddressDisplayType: jest
                            .fn()
                            .mockReturnValue(AddressDisplayOptions.ORIGINAL),
                    },
                },
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: tradingReducer,
                    }),
                }),
                preloadedState: {
                    wallet: {
                        trading: initialState,
                    },
                },
            });

            const result = await storeWithNonChunked.dispatch(
                getPurchaseAddress({ account: mockAccount, address: mockAddress }),
            );

            expect(result.type).toBe(getPurchaseAddress.fulfilled.type);
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
                getPurchaseAddress({ account: mockAccount, address: 'non-existent-address' }),
            );

            expect(result.type).toBe(getPurchaseAddress.rejected.type);
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
                getPurchaseAddress({ account: mockAccount, address: mockAddress }),
            );

            expect(result.type).toBe(getPurchaseAddress.rejected.type);
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
                getPurchaseAddress({ account: mockAccount, address: mockAddress }),
            );

            expect(result.type).toBe(getPurchaseAddress.rejected.type);
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
            expect(getPurchaseAddress.typePrefix).toBe('@trading/thunk/getPurchaseAddress');
        });
    });
});
