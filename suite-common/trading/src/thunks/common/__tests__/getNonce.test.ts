import { combineReducers } from '@reduxjs/toolkit';

import { selectSelectedDevice } from '@suite-common/device';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { getNonce } from '../getNonce';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: jest.fn(),
}));

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    getNonce: jest.fn(),
}));

describe('getNonce thunk', () => {
    const mockDevice = {
        id: 'device-id',
        path: 'device-path',
        features: {
            device_id: 'device-id',
            vendor: 'trezor.io',
            major_version: 2,
            minor_version: 5,
            patch_version: 3,
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createMockStore = (preloadedState = {}) =>
        configureMockStore({
            extra: extraDependenciesCommonMock,
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

    describe('successful nonce retrieval', () => {
        it('should successfully get nonce when device is available', async () => {
            const expectedNonce = 'test-nonce-123456';

            (selectSelectedDevice as jest.Mock).mockReturnValue(mockDevice);
            (TrezorConnect.getNonce as jest.Mock).mockResolvedValue({
                success: true,
                payload: { nonce: expectedNonce },
            });

            const store = createMockStore();
            const result = await store.dispatch(getNonce());

            expect(result.type).toBe(getNonce.fulfilled.type);
            expect(result.payload).toBe(expectedNonce);

            // Verify TrezorConnect.getNonce was called with correct parameters
            expect(TrezorConnect.getNonce).toHaveBeenCalledWith({
                device: mockDevice,
                keepSession: true,
            });
        });

        it('should return nonce value when called multiple times', async () => {
            const expectedNonce1 = 'test-nonce-111';
            const expectedNonce2 = 'test-nonce-222';

            (selectSelectedDevice as jest.Mock).mockReturnValue(mockDevice);

            // First call
            (TrezorConnect.getNonce as jest.Mock).mockResolvedValueOnce({
                success: true,
                payload: { nonce: expectedNonce1 },
            });

            // Second call
            (TrezorConnect.getNonce as jest.Mock).mockResolvedValueOnce({
                success: true,
                payload: { nonce: expectedNonce2 },
            });

            const store = createMockStore();

            const result1 = await store.dispatch(getNonce());
            const result2 = await store.dispatch(getNonce());

            expect(result1.payload).toBe(expectedNonce1);
            expect(result2.payload).toBe(expectedNonce2);
            expect(TrezorConnect.getNonce).toHaveBeenCalledTimes(2);
        });
    });

    describe('error handling', () => {
        it('should reject when no device is available', async () => {
            (selectSelectedDevice as jest.Mock).mockReturnValue(null);

            const store = createMockStore();
            const result = await store.dispatch(getNonce());

            expect(result.type).toBe(getNonce.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_DEVICE_NOT_CONNECTED',
                },
            });

            // Verify TrezorConnect.getNonce was not called
            expect(TrezorConnect.getNonce).not.toHaveBeenCalled();
        });

        it('should reject when device is undefined', async () => {
            (selectSelectedDevice as jest.Mock).mockReturnValue(undefined);

            const store = createMockStore();
            const result = await store.dispatch(getNonce());

            expect(result.type).toBe(getNonce.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_DEVICE_NOT_CONNECTED',
                },
            });
        });

        it('should reject when TrezorConnect.getNonce errors', async () => {
            (selectSelectedDevice as jest.Mock).mockReturnValue(mockDevice);
            (TrezorConnect.getNonce as jest.Mock).mockResolvedValue({
                success: false,
                error: { message: 'Device communication failed' },
            });

            const store = createMockStore();
            const result = await store.dispatch(getNonce());

            expect(result.type).toBe(getNonce.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: {
                    id: 'TR_NONCE_ERROR',
                },
            });

            // Verify TrezorConnect.getNonce was called
            expect(TrezorConnect.getNonce).toHaveBeenCalledWith({
                device: mockDevice,
                keepSession: true,
            });
        });

        it('should reject when TrezorConnect.getNonce throws an error', async () => {
            (selectSelectedDevice as jest.Mock).mockReturnValue(mockDevice);
            (TrezorConnect.getNonce as jest.Mock).mockRejectedValue(
                new Error('Network connection failed'),
            );

            const store = createMockStore();
            const result = await store.dispatch(getNonce());

            expect(result.type).toBe(getNonce.rejected.type);
            // When an async thunk throws an error, it gets rejected
            expect(result.meta.requestStatus).toBe('rejected');
        });
    });

    describe('edge cases', () => {
        it('should handle empty nonce response', async () => {
            (selectSelectedDevice as jest.Mock).mockReturnValue(mockDevice);
            (TrezorConnect.getNonce as jest.Mock).mockResolvedValue({
                success: true,
                payload: { nonce: '' },
            });

            const store = createMockStore();
            const result = await store.dispatch(getNonce());

            expect(result.type).toBe(getNonce.fulfilled.type);
            expect(result.payload).toBe('');
        });

        it('should handle device with minimal properties', async () => {
            const minimalDevice = {
                id: 'minimal-device',
                path: 'minimal-path',
            };

            (selectSelectedDevice as jest.Mock).mockReturnValue(minimalDevice);
            (TrezorConnect.getNonce as jest.Mock).mockResolvedValue({
                success: true,
                payload: { nonce: 'minimal-nonce' },
            });

            const store = createMockStore();
            const result = await store.dispatch(getNonce());

            expect(result.type).toBe(getNonce.fulfilled.type);
            expect(result.payload).toBe('minimal-nonce');

            expect(TrezorConnect.getNonce).toHaveBeenCalledWith({
                device: minimalDevice,
                keepSession: true,
            });
        });

        it('should handle different device types', async () => {
            const trezorOneDevice = {
                id: 'trezor-one-id',
                path: 'trezor-one-path',
                features: {
                    device_id: 'trezor-one-id',
                    vendor: 'trezor.io',
                    major_version: 1,
                    minor_version: 11,
                    patch_version: 2,
                },
            };

            (selectSelectedDevice as jest.Mock).mockReturnValue(trezorOneDevice);
            (TrezorConnect.getNonce as jest.Mock).mockResolvedValue({
                success: true,
                payload: { nonce: 'trezor-one-nonce' },
            });

            const store = createMockStore();
            const result = await store.dispatch(getNonce());

            expect(result.type).toBe(getNonce.fulfilled.type);
            expect(result.payload).toBe('trezor-one-nonce');

            expect(TrezorConnect.getNonce).toHaveBeenCalledWith({
                device: trezorOneDevice,
                keepSession: true,
            });
        });
    });

    describe('thunk metadata', () => {
        it('should have correct thunk type prefix', () => {
            expect(getNonce.typePrefix).toBe('@trading/thunk/getNonce');
        });

        it('should handle pending state correctly', async () => {
            (selectSelectedDevice as jest.Mock).mockReturnValue(mockDevice);
            (TrezorConnect.getNonce as jest.Mock).mockImplementation(
                () =>
                    new Promise(resolve => {
                        setTimeout(
                            () =>
                                resolve({
                                    success: true,
                                    payload: { nonce: 'delayed-nonce' },
                                }),
                            100,
                        );
                    }),
            );

            const store = createMockStore();
            const promise = store.dispatch(getNonce());

            // Check if the action is in pending state
            const actions = store.getActions();
            expect(actions[0]?.type).toBe(getNonce.pending.type);

            const result = await promise;
            expect(result.type).toBe(getNonce.fulfilled.type);
        });
    });
});
