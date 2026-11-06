import { type Dispatch } from '@reduxjs/toolkit';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type OnStorageEnsured, type SuiteSync } from '@suite-common/suite-sync-types';
import { type GetTrezorConnectPrivilegedDep } from '@trezor/connect';
import { type FetchDep } from '@trezor/type-utils';

export type SuiteSyncDesktopFactoryDeps = {
    getState: () => any;
    dispatch: Dispatch;
    onStorageEnsured: OnStorageEnsured;
} & GetTrezorConnectPrivilegedDep &
    PlatformEncryptionDep &
    EnsureDelegatedIdentityKeyDep &
    DesktopAnalyticsDep &
    FetchDep;

export type SuiteSyncDesktopFactory = (deps: SuiteSyncDesktopFactoryDeps) => SuiteSync;

export type SuiteSyncDesktopFactoryDep = {
    suiteSyncDesktopFactory: SuiteSyncDesktopFactory;
};
