import { createMockDeps } from '@suite-common/dependency-injection';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { SuiteSyncUnavailableOnDeviceError } from '../../createEnsureSuiteSyncKeys';
import { type CreateEnsureWalletSuiteSyncOnAsyncDeps } from '../createEnsureWalletSuiteSyncOnAsync';
import { createEnsureWalletSuiteSyncOnAsync } from '../createEnsureWalletSuiteSyncOnAsync';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

describe(createEnsureWalletSuiteSyncOnAsync.name, () => {
    it('does not call async error handler on success', async () => {
        const device = mockSuiteDevice({
            id: 'device-id',
            state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
        });
        const deps = createMockDeps<CreateEnsureWalletSuiteSyncOnAsyncDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok({ data: {} } as any)),
            suiteSyncAsyncErrorHandler: () => undefined,
            getDeviceForStaticSessionId: () => device,
        });

        await createEnsureWalletSuiteSyncOnAsync(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.suiteSyncAsyncErrorHandler).not.toHaveBeenCalled();
    });

    it('propagates failure with the resolved device', async () => {
        const device = mockSuiteDevice({
            id: 'device-id',
            state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
        });
        const error = { type: 'QuotaManagerCommunicationFailed' as const, caused: 'network' };
        const deps = createMockDeps<CreateEnsureWalletSuiteSyncOnAsyncDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(err(error)),
            suiteSyncAsyncErrorHandler: () => undefined,
            getDeviceForStaticSessionId: () => device,
        });

        await createEnsureWalletSuiteSyncOnAsync(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.suiteSyncAsyncErrorHandler).toHaveBeenCalledWith({
            error,
            device,
        });
    });

    it('propagates failure with null device when the resolved device has no state', async () => {
        const error = SuiteSyncUnavailableOnDeviceError();
        const deps = createMockDeps<CreateEnsureWalletSuiteSyncOnAsyncDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(err(error)),
            suiteSyncAsyncErrorHandler: () => undefined,
            getDeviceForStaticSessionId: () => mockSuiteDevice({ state: undefined }),
        });

        await createEnsureWalletSuiteSyncOnAsync(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.suiteSyncAsyncErrorHandler).toHaveBeenCalledWith({
            error,
            device: null,
        });
    });
});
