import { createMockDeps } from '@suite-common/dependency-injection';
import { DeviceError } from '@suite-common/device';
import { type AllocateOwnerQuotaErr } from '@suite-common/suite-sync-quota-manager';
import { asSuiteSyncOwnerId } from '@suite-common/suite-sync-storage';
import {
    type DeviceErrorType,
    type TrezorDevice,
    asDelegatedIdentityKey,
} from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type StaticSessionId } from '@trezor/connect';
import { asWalletDescriptor } from '@trezor/device-utils';
import { err, ok } from '@trezor/type-utils';

import {
    type SuiteSyncInternalErrorHandlerDeps,
    createSuiteSyncInternalErrorHandler,
} from './createSuiteSyncInternalErrorHandler';

const ownerId = asSuiteSyncOwnerId('owner-id');
const walletDescriptor = asWalletDescriptor('wallet-descriptor');
const staticSessionId = `${walletDescriptor}@device-id:1` as StaticSessionId;

const createDevice = (overrides: Partial<TrezorDevice> = {}): TrezorDevice =>
    mockSuiteDevice({
        id: 'device-id',
        state: {
            staticSessionId,
        },
        ...overrides,
    });

describe(createSuiteSyncInternalErrorHandler.name, () => {
    it('propagates a device error when no selected device is available', async () => {
        const deps = createMockDeps<SuiteSyncInternalErrorHandlerDeps>({
            allocateOwnerQuota: null,
            ensureDelegatedIdentityKey: null,
            suiteSyncUncontrolledErrorHandler: () => undefined,
            getSelectedDevice: () => undefined,
        });

        const handleError = createSuiteSyncInternalErrorHandler(deps);

        await handleError({ type: 'RelayQuotaExceeded', ownerId });

        expect(deps.suiteSyncUncontrolledErrorHandler).toHaveBeenCalledWith({
            error: DeviceError('Device not found during handling SuiteSync internal error'),
            device: null,
        });
        expect(deps.ensureDelegatedIdentityKey).not.toHaveBeenCalled();
        expect(deps.allocateOwnerQuota).not.toHaveBeenCalled();
    });

    it('retrieves delegated key and allocates additional owner quota for RelayQuotaExceeded', async () => {
        const device = createDevice();
        const deps = createMockDeps<SuiteSyncInternalErrorHandlerDeps>({
            allocateOwnerQuota: () => Promise.resolve(ok()),
            ensureDelegatedIdentityKey: () =>
                Promise.resolve(ok(asDelegatedIdentityKey('delegated-key'))),
            suiteSyncUncontrolledErrorHandler: () => undefined,
            getSelectedDevice: () => device,
        });

        const handleError = createSuiteSyncInternalErrorHandler(deps);

        await handleError({ type: 'RelayQuotaExceeded', ownerId });

        expect(deps.ensureDelegatedIdentityKey).toHaveBeenCalledWith({ device });
        expect(deps.allocateOwnerQuota).toHaveBeenCalledWith({
            ownerId,
            delegatedKey: asDelegatedIdentityKey('delegated-key'),
            deviceId: 'device-id',
            walletDescriptor,
            isWriteMode: true,
        });
        expect(deps.suiteSyncUncontrolledErrorHandler).not.toHaveBeenCalled();
    });

    it('propagates delegated key retrieval failures', async () => {
        const device = createDevice();
        const deviceError: DeviceErrorType = DeviceError('Delegated key failed');
        const deps = createMockDeps<SuiteSyncInternalErrorHandlerDeps>({
            allocateOwnerQuota: null,
            ensureDelegatedIdentityKey: () => Promise.resolve(err(deviceError)),
            suiteSyncUncontrolledErrorHandler: () => undefined,
            getSelectedDevice: () => device,
        });

        const handleError = createSuiteSyncInternalErrorHandler(deps);

        await handleError({ type: 'RelayQuotaExceeded', ownerId });

        expect(deps.allocateOwnerQuota).not.toHaveBeenCalled();
        expect(deps.suiteSyncUncontrolledErrorHandler).toHaveBeenCalledWith({
            error: deviceError,
            device,
        });
    });

    it('propagates allocation failures', async () => {
        const device = createDevice();
        const allocationError: AllocateOwnerQuotaErr = {
            type: 'QuotaManagerCommunicationFailed',
            caused: new Error('quota manager failed'),
        };

        const deps = createMockDeps<SuiteSyncInternalErrorHandlerDeps>({
            allocateOwnerQuota: () => Promise.resolve(err(allocationError)),
            ensureDelegatedIdentityKey: () =>
                Promise.resolve(ok(asDelegatedIdentityKey('delegated-key'))),
            suiteSyncUncontrolledErrorHandler: () => undefined,
            getSelectedDevice: () => device,
        });

        const handleError = createSuiteSyncInternalErrorHandler(deps);

        await handleError({ type: 'RelayQuotaExceeded', ownerId });

        expect(deps.suiteSyncUncontrolledErrorHandler).toHaveBeenCalledWith({
            error: allocationError,
            device,
        });
    });

    it('forwards RelayOther errors to the async error handler', async () => {
        const device = createDevice();
        const relayError = { type: 'RelayOther', message: 'relay failed' } as const;

        const deps = createMockDeps<SuiteSyncInternalErrorHandlerDeps>({
            allocateOwnerQuota: null,
            ensureDelegatedIdentityKey: null,
            suiteSyncUncontrolledErrorHandler: () => undefined,
            getSelectedDevice: () => device,
        });

        const handleError = createSuiteSyncInternalErrorHandler(deps);

        await handleError(relayError);

        expect(deps.suiteSyncUncontrolledErrorHandler).toHaveBeenCalledWith({
            error: relayError,
            device,
        });
        expect(deps.ensureDelegatedIdentityKey).not.toHaveBeenCalled();
        expect(deps.allocateOwnerQuota).not.toHaveBeenCalled();
    });
});
