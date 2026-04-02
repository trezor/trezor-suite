import { createMockDeps } from '@suite-common/dependency-injection';
import {
    type SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type StaticSessionId } from '@trezor/connect';
import { ok } from '@trezor/type-utils';

import { type EnsureQuotaDeps, createEnsureQuota } from '../createEnsureQuota';

const OWNER_ABCD: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('owner-id-abcd'),
    ownerSecret: asSuiteSyncOwnerSecretHex('owner-secret-abcd'),
};

const DELEGATED_KEY = asDelegatedIdentityKey('delegated-key-abcd');

const deviceStaticSessionId: StaticSessionId = '1@device-id:3';

const DEFAULT_PARAMS = {
    deviceStaticSessionId,
    delegatedKey: DELEGATED_KEY,
    owner: OWNER_ABCD,
    isWriteMode: false,
};

describe(createEnsureQuota.name, () => {
    it.each([
        {
            description: 'device is not found',
            getDevice: () => null,
        },
        {
            description: 'device has no id',
            getDevice: () => mockSuiteDevice({ id: undefined } as any),
        },
    ])('returns ok without dispatching when $description', async ({ getDevice }) => {
        const deps = createMockDeps<EnsureQuotaDeps>({
            dispatch: null,
            getDeviceHasAllowance: null,
            getDeviceForStaticSessionId: () => getDevice(),
        });

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result).toEqual(ok(undefined));
        expect(deps.dispatch).not.toHaveBeenCalled();
    });

    it('returns ok without dispatching when allowance is granted', async () => {
        const device = mockSuiteDevice();

        const deps = createMockDeps<EnsureQuotaDeps>({
            dispatch: null,
            getDeviceHasAllowance: () => true,
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result).toEqual(ok(undefined));
        expect(deps.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches when allowance is not granted', async () => {
        const device = mockSuiteDevice();

        const deps = createMockDeps<EnsureQuotaDeps>({
            dispatch: () => Promise.resolve({ success: true }),
            getDeviceHasAllowance: () => false,
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result).toEqual(ok(undefined));
        expect(deps.dispatch).toHaveBeenCalled();
    });

    it('returns WriteModeRequiredForAllocation error when allocation fails with that error', async () => {
        const device = mockSuiteDevice();

        const deps = createMockDeps<EnsureQuotaDeps>({
            dispatch: () =>
                Promise.resolve({
                    success: false,
                    error: { type: 'WriteModeRequiredForAllocation' },
                }),
            getDeviceHasAllowance: () => false,
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('WriteModeRequiredForAllocation');
    });

    it('returns ok when allocation fails with a different error type', async () => {
        const device = mockSuiteDevice();

        const deps = createMockDeps<EnsureQuotaDeps>({
            dispatch: () =>
                Promise.resolve({
                    success: false,
                    error: { type: 'HttpError' },
                }),
            getDeviceHasAllowance: () => false,
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result).toEqual(ok(undefined));
    });

    it('uses the current allowance state when deciding whether to dispatch', async () => {
        const device = mockSuiteDevice();
        let hasDeviceAllowance = false;

        const deps = createMockDeps<EnsureQuotaDeps>({
            dispatch: null,
            getDeviceHasAllowance: () => hasDeviceAllowance,
            getDeviceForStaticSessionId: () => device,
        });

        hasDeviceAllowance = true;

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result).toEqual(ok(undefined));
        expect(deps.dispatch).not.toHaveBeenCalled();
    });
});
