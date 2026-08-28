import { createMockDeps } from '@suite-common/dependency-injection';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { err, ok } from '@trezor/type-utils';

import { SuiteSyncUnavailableOnDeviceError } from '../createEnsureSuiteSyncKeys';
import { type EnsureWalletSuiteSyncOnUncontrolledDeps } from './createEnsureWalletSuiteSyncOnUncontrolled';
import { createEnsureWalletSuiteSyncOnUncontrolled } from './createEnsureWalletSuiteSyncOnUncontrolled';

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

describe(createEnsureWalletSuiteSyncOnUncontrolled.name, () => {
    it('does not call async error handler on success', async () => {
        const device = mockSuiteDevice({
            id: 'device-id',
            state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
        });
        const deps = createMockDeps<EnsureWalletSuiteSyncOnUncontrolledDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(ok({ data: {} } as any)),
            suiteSyncUncontrolledErrorHandler: () => undefined,
            getDeviceForStaticSessionId: () => device,
        });

        await createEnsureWalletSuiteSyncOnUncontrolled(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.suiteSyncUncontrolledErrorHandler).not.toHaveBeenCalled();
    });

    it('propagates failure with the resolved device', async () => {
        const device = mockSuiteDevice({
            id: 'device-id',
            state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
        });
        const error = { type: 'QuotaManagerCommunicationFailed' as const, caused: 'network' };
        const deps = createMockDeps<EnsureWalletSuiteSyncOnUncontrolledDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(err(error)),
            suiteSyncUncontrolledErrorHandler: () => undefined,
            getDeviceForStaticSessionId: () => device,
        });

        await createEnsureWalletSuiteSyncOnUncontrolled(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.suiteSyncUncontrolledErrorHandler).toHaveBeenCalledWith({
            error,
            device,
        });
    });

    it('does not call async error handler for unsupported device error', async () => {
        const error = SuiteSyncUnavailableOnDeviceError();
        const deps = createMockDeps<EnsureWalletSuiteSyncOnUncontrolledDeps>({
            ensureWalletSuiteSyncOn: () => Promise.resolve(err(error)),
            suiteSyncUncontrolledErrorHandler: () => undefined,
            getDeviceForStaticSessionId: () => mockSuiteDevice({ state: undefined }),
        });

        await createEnsureWalletSuiteSyncOnUncontrolled(deps)({
            deviceStaticSessionId: DEVICE_STATIC_SESSION_ID_123,
            isWriteMode: false,
        });

        expect(deps.suiteSyncUncontrolledErrorHandler).not.toHaveBeenCalled();
    });
});
