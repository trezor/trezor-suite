import { type Dispatch } from '@reduxjs/toolkit';

import { createMockDeps, mock } from '@suite-common/dependency-injection';
import { type StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import type { CreateEnsureWalletSuiteSyncOnWithFwCheckDeps } from '../createEnsureWalletSuiteSyncOnWithErrorHandler';
import { createEnsureWalletSuiteSyncOnWithErrorHandler } from '../createEnsureWalletSuiteSyncOnWithErrorHandler';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

describe(createEnsureWalletSuiteSyncOnWithErrorHandler.name, () => {
    it.each([
        {
            description: 'firmware upgrade error',
            innerResult: err({
                type: 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType' as const,
            }),
            expectedDispatchedAction: {
                type: 'suiteSync/setSuiteSyncError',
                payload: {
                    deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
                    error: {
                        type: 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType',
                    },
                },
            },
        },
        {
            description: 'device error',
            innerResult: err({ type: 'DeviceError' as const, message: 'some error' }),
            expectedDispatchedAction: {
                type: 'suiteSync/setSuiteSyncError',
                payload: {
                    deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
                    error: { type: 'DeviceError', message: 'some error' },
                },
            },
        },
        {
            description: 'success',
            innerResult: ok({ data: {} } as any),
            expectedDispatchedAction: {
                type: 'suiteSync/resetSuiteSyncError',
                payload: {
                    deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
                },
            },
        },
    ])(
        'dispatches correct error for $description and passes result through',
        async ({ innerResult, expectedDispatchedAction }) => {
            const deps = createMockDeps<CreateEnsureWalletSuiteSyncOnWithFwCheckDeps>({
                dispatch: mock<Dispatch>(() => {}),
                ensureWalletSuiteSyncOn: () => Promise.resolve(innerResult),
            });

            const result = await createEnsureWalletSuiteSyncOnWithErrorHandler(deps)({
                deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
                isWriteMode: false,
            });

            expect(result).toBe(innerResult);
            expect(deps.dispatch).toHaveBeenCalledWith(
                expect.objectContaining(expectedDispatchedAction),
            );
        },
    );

    it('delegates to ensureWalletSuiteSyncOn with correct params', async () => {
        const ensureResult = ok({ data: {} } as any);

        const deps = createMockDeps<CreateEnsureWalletSuiteSyncOnWithFwCheckDeps>({
            dispatch: mock<Dispatch>(() => {}),
            ensureWalletSuiteSyncOn: () => Promise.resolve(ensureResult),
        });

        await createEnsureWalletSuiteSyncOnWithErrorHandler(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.ensureWalletSuiteSyncOn).toHaveBeenCalledWith({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });
    });
});
