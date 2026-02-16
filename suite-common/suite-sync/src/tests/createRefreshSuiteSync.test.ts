import { Dispatch } from '@reduxjs/toolkit';

import { EnsureDelegatedIdentityKey } from '@suite-common/delegated-identity-key-types';
import { mockNotExpected } from '@suite-common/dependency-injection';
import { asSuiteSyncOwnerId, asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { EnsureSuiteSyncOwner } from '@suite-common/suite-sync-types';
import { TrezorDevice, asDelegatedIdentityKey } from '@suite-common/suite-types';
import { ok } from '@trezor/type-utils';

import { RefreshSuiteSyncKeysDeps, createRefreshSuiteSync } from '../createRefreshSuiteSyncKeys';
import { GetDeviceForStaticSessionId } from '../getDeviceForStaticSessionId';
import { LoadSuiteSyncOwnerFromState } from '../owner/createLoadSuiteSyncOwnerFromState';

const createMockDeps = () =>
    ({
        dispatch: mockNotExpected<Dispatch>('dispatch'),
        hasAllowance: mockNotExpected<RefreshSuiteSyncKeysDeps['hasAllowance']>('hasAllowance'),
        ensureSuiteSyncOwner: mockNotExpected<EnsureSuiteSyncOwner>('ensureSuiteSyncOwner'),
        loadSuiteSyncOwnerFromState: mockNotExpected<LoadSuiteSyncOwnerFromState>(
            'loadSuiteSyncOwnerFromState',
        ),
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
            isWriteMode: false,
        });

        expect(result.success).toEqual(false);
        expect(!result.success && result.error.type).toBe('SuiteSyncUnavailableOnDeviceError');
    });

    it('returns an suite sync owner when device has state and is available', async () => {
        const deps = createMockDeps();
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(OWNER_1);
        deps.hasAllowance.mockReturnValue(true);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        const result = await refreshSuiteSyncKeys({
            device: createDevice(),
            isWriteMode: false,
        });

        expect(result.success).toEqual(true);
        expect(result.success && result.payload).toEqual(OWNER_1);
    });

    it('fails to get keys, when device is disconnected', async () => {
        const deps = createMockDeps();
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(null);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        const result = await refreshSuiteSyncKeys({
            device: createDevice({ connected: false }),
            isWriteMode: false,
        });

        expect(result.success).toEqual(false);
        expect(!result.success && result.error.type).toEqual('SuiteSyncUnavailableOnDeviceError');
    });

    it('ensures that the delegated identity key is available when owner is not in state', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() => Promise.resolve(ok()));
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(null);
        deps.ensureSuiteSyncOwner.mockResolvedValue(ok(OWNER_1));
        deps.ensureDelegatedIdentityKey.mockResolvedValue(
            ok(asDelegatedIdentityKey('delegated-key-value')),
        );

        const mockDevice = createDevice();
        deps.getDeviceForStaticSessionId.mockImplementation(() => mockDevice);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        await refreshSuiteSyncKeys({
            device: mockDevice,
            isWriteMode: false,
        });

        expect(deps.ensureDelegatedIdentityKey).toHaveBeenCalledWith({
            device: mockDevice,
        });
    });

    it('requests ensureSuiteSyncOwner when owner is not in state', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() =>
            Promise.resolve({
                success: false,
                error: { type: 'WriteModeRequiredForAllocation' },
            }),
        );
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(null);
        deps.ensureSuiteSyncOwner.mockResolvedValue(ok(OWNER_1));
        deps.ensureDelegatedIdentityKey.mockResolvedValue(
            ok(asDelegatedIdentityKey('delegated-key-value')),
        );

        const mockDevice = createDevice();
        deps.getDeviceForStaticSessionId.mockImplementation(() => mockDevice);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        await refreshSuiteSyncKeys({
            device: mockDevice,
            isWriteMode: false,
        });

        expect(deps.ensureSuiteSyncOwner).toHaveBeenCalledWith({
            device: mockDevice,
            delegatedKey: 'delegated-key-value',
        });
    });

    it('finally returns the new refreshed owner', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() => Promise.resolve(ok()));
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(null);
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
            isWriteMode: false,
        });

        expect(result.success).toBe(true);
        expect(result.success && result.payload.ownerId).toEqual('new-owner-id');
        expect(result.success && result.payload.ownerSecret).toEqual('new-secret-public-key');
    });
});
