import { Dispatch } from '@reduxjs/toolkit';

import { EnsureDelegatedIdentityKey } from '@suite-common/delegated-identity-key-types';
import { EnsureSuiteSyncOwner } from '@suite-common/suite-sync-types';
import {
    TrezorDevice,
    asDelegatedIdentityKey,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
} from '@suite-common/suite-types';
import { ok } from '@trezor/type-utils';

import { mockNotExpected } from '../../tests/utils';
import { RefreshSuiteSyncKeysDeps, createRefreshSuiteSync } from '../createRefreshSuiteSyncKeys';
import { LoadSuiteSyncOwnerFromState } from '../owner/createLoadSuiteSyncOwnerFromState';

const createMockDeps = () =>
    ({
        dispatch: mockNotExpected<Dispatch>('dispatch'),
        ensureSuiteSyncOwner: mockNotExpected<EnsureSuiteSyncOwner>('ensureSuiteSyncOwner'),
        loadSuiteSyncOwnerFromState: mockNotExpected<LoadSuiteSyncOwnerFromState>(
            'loadSuiteSyncOwnerFromState',
        ),
        ensureDelegatedIdentityKey: mockNotExpected<EnsureDelegatedIdentityKey>(
            'ensureDelegatedIdentityKey',
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

        expect(result.ok).toEqual(false);
        expect(!result.ok && result.error.type).toBe('RefreshSuiteKeysUnavailable');
    });

    it('returns an suite sync owner when device has state and is available', async () => {
        const deps = createMockDeps();
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(OWNER_1);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        const result = await refreshSuiteSyncKeys({
            device: createDevice(),
        });

        expect(result.ok).toEqual(true);
        expect(result.ok && result.value).toEqual(OWNER_1);
    });

    it('fails to get keys, when device is disconnected', async () => {
        const deps = createMockDeps();
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(null);

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        const result = await refreshSuiteSyncKeys({
            device: createDevice({ connected: false }),
        });

        expect(result.ok).toEqual(false);
        expect(!result.ok && result.error.type).toEqual('RefreshSuiteKeysUnavailable');
    });

    it('ensures that the delegated identity key is available when owner is not in state', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() => Promise.resolve(undefined));
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(null);
        deps.ensureSuiteSyncOwner.mockResolvedValue(ok(OWNER_1));
        deps.ensureDelegatedIdentityKey.mockResolvedValue(
            ok(asDelegatedIdentityKey('delegated-key-value')),
        );

        const mockDevice = createDevice();
        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        await refreshSuiteSyncKeys({
            device: mockDevice,
        });

        expect(deps.ensureDelegatedIdentityKey).toHaveBeenCalledWith({
            device: mockDevice,
        });
    });

    it('requests ensureSuiteSyncOwner when owner is not in state', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() => Promise.resolve(undefined));
        deps.loadSuiteSyncOwnerFromState.mockResolvedValue(null);
        deps.ensureSuiteSyncOwner.mockResolvedValue(ok(OWNER_1));
        deps.ensureDelegatedIdentityKey.mockResolvedValue(
            ok(asDelegatedIdentityKey('delegated-key-value')),
        );

        const mockDevice = createDevice();
        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        await refreshSuiteSyncKeys({
            device: mockDevice,
        });

        expect(deps.ensureSuiteSyncOwner).toHaveBeenCalledWith({
            device: mockDevice,
            delegatedKey: 'delegated-key-value',
        });
    });

    it('finally returns the new refreshed owner', async () => {
        const deps = createMockDeps();
        deps.dispatch.mockImplementation(() => Promise.resolve(undefined));
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

        const refreshSuiteSyncKeys = createRefreshSuiteSync(deps);
        const result = await refreshSuiteSyncKeys({
            device: createDevice(),
        });

        expect(result.ok).toBe(true);
        expect(result.ok && result.value.ownerId).toEqual('new-owner-id');
        expect(result.ok && result.value.ownerSecret).toEqual('new-secret-public-key');
    });
});
