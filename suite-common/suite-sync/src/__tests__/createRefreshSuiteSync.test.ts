import { type Dispatch } from '@reduxjs/toolkit';

import { type EnsureDelegatedIdentityKey } from '@suite-common/delegated-identity-key-types';
import { mockNotExpected } from '@suite-common/dependency-injection';
import { asSuiteSyncOwnerId, asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { type EnsureSuiteSyncOwner } from '@suite-common/suite-sync-types';
import { type TrezorDevice, asDelegatedIdentityKey } from '@suite-common/suite-types';
import { ok } from '@trezor/type-utils';

import {
    type RefreshSuiteSyncKeysDeps,
    createRefreshSuiteSync,
} from '../createRefreshSuiteSyncKeys';
import { type GetDeviceForStaticSessionId } from '../getDeviceForStaticSessionId';

const createMockDeps = () =>
    ({
        dispatch: mockNotExpected<Dispatch>('dispatch'),
        ensureSuiteSyncOwner: mockNotExpected<EnsureSuiteSyncOwner>('ensureSuiteSyncOwner'),
        ensureDelegatedIdentityKey: mockNotExpected<EnsureDelegatedIdentityKey>(
            'ensureDelegatedIdentityKey',
        ),
        getDeviceForStaticSessionId: mockNotExpected<GetDeviceForStaticSessionId>(
            'getDeviceForStaticSessionId',
        ),
    }) satisfies RefreshSuiteSyncKeysDeps;

const OWNER_1 = {
    ownerId: asSuiteSyncOwnerId('new-owner-id'),
    ownerSecret: asSuiteSyncOwnerSecretHex('new-owner-secret'),
};

const createDevice = (
    overrides: Partial<TrezorDevice> = {},
    deviceStateOverrides: Partial<TrezorDevice['state']> | null = {},
): TrezorDevice =>
    ({
        id: 'test-device-id',
        connected: true,
        mode: 'normal',
        ...(deviceStateOverrides
            ? {
                  state: {
                      device: {
                          path: 'test-path',
                          instance: 1,
                      },
                      staticSessionId: 'test-session-id',
                      ...deviceStateOverrides,
                  },
              }
            : {}),
        ...overrides,
    }) as unknown as TrezorDevice;

describe(createRefreshSuiteSync.name, () => {
    it('fails with "unable to get keys" when device is not initialized', async () => {
        const deps = createMockDeps();
        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        const result = await refreshSuiteSyncKeys({
            device: createDevice({}, null),
        });

        expect(result.success).toEqual(false);
        expect(!result.success && result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
    });

    it('ensures that the delegated identity key is available', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() => Promise.resolve(ok()));
        deps.ensureSuiteSyncOwner.mockResolvedValue(ok(OWNER_1));
        deps.ensureDelegatedIdentityKey.mockResolvedValue(
            ok(asDelegatedIdentityKey('delegated-key-value')),
        );

        const mockDevice = createDevice();
        deps.getDeviceForStaticSessionId.mockImplementation(() => mockDevice);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        const result = await refreshSuiteSyncKeys({
            device: mockDevice,
        });

        expect(deps.ensureDelegatedIdentityKey).toHaveBeenCalledWith({
            device: mockDevice,
        });
        expect(result.success).toBe(true);
        expect(result.success && result.payload).toEqual({
            owner: OWNER_1,
            delegatedKey: asDelegatedIdentityKey('delegated-key-value'),
        });
    });

    it('requests ensureSuiteSyncOwner', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() => Promise.resolve(ok()));
        deps.ensureSuiteSyncOwner.mockResolvedValue(ok(OWNER_1));
        deps.ensureDelegatedIdentityKey.mockResolvedValue(
            ok(asDelegatedIdentityKey('delegated-key-value')),
        );

        const mockDevice = createDevice();
        deps.getDeviceForStaticSessionId.mockImplementation(() => mockDevice);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        await refreshSuiteSyncKeys({
            device: mockDevice,
        });

        expect(deps.ensureSuiteSyncOwner).toHaveBeenCalledWith({
            device: mockDevice,
            delegatedKey: 'delegated-key-value',
        });
    });

    it('returns owner and delegatedKey on success', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() => Promise.resolve(ok()));
        deps.ensureDelegatedIdentityKey.mockResolvedValue(
            ok(asDelegatedIdentityKey('delegated-key-value')),
        );
        deps.ensureSuiteSyncOwner.mockResolvedValue(
            ok({
                ownerId: asSuiteSyncOwnerId('new-owner-id'),
                ownerSecret: asSuiteSyncOwnerSecretHex('new-secret-public-key'),
            }),
        );

        const mockDevice = createDevice();
        deps.getDeviceForStaticSessionId.mockImplementation(() => mockDevice);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        const result = await refreshSuiteSyncKeys({
            device: mockDevice,
        });

        expect(result.success).toBe(true);
        expect(result.success && result.payload).toEqual({
            owner: {
                ownerId: asSuiteSyncOwnerId('new-owner-id'),
                ownerSecret: asSuiteSyncOwnerSecretHex('new-secret-public-key'),
            },
            delegatedKey: asDelegatedIdentityKey('delegated-key-value'),
        });
    });
});
