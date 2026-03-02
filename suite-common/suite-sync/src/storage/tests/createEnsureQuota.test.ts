import { createMockDeps } from '@suite-common/dependency-injection';
import {
    SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-sync-storage';
import { asDelegatedIdentityKey } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { StaticSessionId } from '@trezor/connect';
import { ok } from '@trezor/type-utils';

import { EnsureQuotaDeps, createEnsureQuota } from '../createEnsureQuota';

const OWNER_ABCD: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('owner-id-abcd'),
    ownerSecret: asSuiteSyncOwnerSecretHex('owner-secret-abcd'),
};

const DELEGATED_KEY = asDelegatedIdentityKey('delegated-key-abcd');

const deviceStaticSessionId: StaticSessionId = '1@device-id:3';

const DEFAULT_RELAY_URL = 'wss://default-relay.example.com';

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
            hasAllowance: null,
            defaultRelayUrl: DEFAULT_RELAY_URL,
            getRelayUrl: () => DEFAULT_RELAY_URL,
            getEnforceQuotaManager: () => false,
            getDeviceForStaticSessionId: () => getDevice(),
        });

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result).toEqual(ok(undefined));
        expect(deps.dispatch).not.toHaveBeenCalled();
    });

    it.each([
        {
            description: 'device has allowance',
            hasAllowance: () => true,
            relayUrl: DEFAULT_RELAY_URL,
        },
        {
            description: 'quota manager is disabled (custom relay URL)',
            hasAllowance: () => false,
            relayUrl: 'wss://custom-relay.example.com',
        },
    ])('returns ok without dispatching when $description', async ({ hasAllowance, relayUrl }) => {
        const device = mockSuiteDevice();

        const deps = createMockDeps<EnsureQuotaDeps>({
            dispatch: null,
            hasAllowance,
            defaultRelayUrl: DEFAULT_RELAY_URL,
            getRelayUrl: () => relayUrl,
            getEnforceQuotaManager: () => false,
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result).toEqual(ok(undefined));
        expect(deps.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches when enforceQuotaManager is set with custom relay URL', async () => {
        const device = mockSuiteDevice();

        const deps = createMockDeps<EnsureQuotaDeps>({
            dispatch: () => Promise.resolve({ success: true }),
            hasAllowance: () => false,
            defaultRelayUrl: DEFAULT_RELAY_URL,
            getRelayUrl: () => 'wss://custom-relay.example.com',
            getEnforceQuotaManager: () => true,
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
            hasAllowance: () => false,
            defaultRelayUrl: DEFAULT_RELAY_URL,
            getRelayUrl: () => DEFAULT_RELAY_URL,
            getEnforceQuotaManager: () => false,
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
            hasAllowance: () => false,
            defaultRelayUrl: DEFAULT_RELAY_URL,
            getRelayUrl: () => DEFAULT_RELAY_URL,
            getEnforceQuotaManager: () => false,
            getDeviceForStaticSessionId: () => device,
        });

        const result = await createEnsureQuota(deps)(DEFAULT_PARAMS);

        expect(result).toEqual(ok(undefined));
    });
});
