import type { AddressValidatorDep } from '@suite-common/address';
import type { AnalyticsDep } from '@suite-common/analytics';
import { type Bip329Dep } from '@suite-common/bip329-types';
import { type EnsureDelegatedIdentityKeyDep } from '@suite-common/delegated-identity-key-types';
import { type Getter } from '@suite-common/dependency-injection';
import type {
    FindNetworkSymbolForProtocolDep,
    GetNetworkConfigDep,
    NetworkModuleRepositoryDep,
} from '@suite-common/networks';
import { type PlatformEncryptionDep } from '@suite-common/platform-encryption';
import { type MigrateSuiteSyncLabelsForRbfTransactionDep } from '@suite-common/suite-rbf-labels-migrations-types';
import { type SuiteSyncDep } from '@suite-common/suite-sync-types';
import {
    type ConnectInitHooksDeps,
    type ConnectInitSettingsDep,
    type GetAllowPrereleaseDep,
    type GetBinFilesBaseUrlDep,
    type GetIsWindowVisibleDep,
    type GetLanguageDep,
    type ReloadAppDep,
    type ReportSecurityCheckDep,
    type RerunFwAuthenticityChecksCallDep,
    type ShouldRetryFirmwareRevisionCheckErrorDep,
    type ThpHostNameDep,
    type TransportsDep,
} from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type GetTradedAccountKeysDep,
    type SelectedAccountStatus,
} from '@suite-common/wallet-types';
import { type CreateLoggerDep, type ThpSettings } from '@trezor/connect';

export type CommonServices = SuiteSyncDep &
    AddressValidatorDep &
    GetNetworkConfigDep &
    FindNetworkSymbolForProtocolDep &
    NetworkModuleRepositoryDep &
    Bip329Dep &
    EnsureDelegatedIdentityKeyDep &
    PlatformEncryptionDep &
    AnalyticsDep &
    ConnectInitSettingsDep &
    ConnectInitHooksDeps &
    GetAllowPrereleaseDep &
    GetBinFilesBaseUrlDep &
    ShouldRetryFirmwareRevisionCheckErrorDep &
    RerunFwAuthenticityChecksCallDep &
    GetIsWindowVisibleDep &
    GetLanguageDep &
    GetTradedAccountKeysDep & {
        saveAs: (data: Blob, fileName: string) => void;
        // Getters, so a component cannot read them during render and miss later state changes.
        // See `toGetter`/`useGetter` in @suite-common/dependency-injection.
        getTokenDefinitionsEnabledNetworks: Getter<[], NetworkSymbol[]>;
        getDebugSettings: Getter<[], any>;
        getSelectedAccount: Getter<[], SelectedAccountStatus>;
        getTradingEnvironment: Getter<
            [],
            'production' | 'staging' | 'dev' | 'localhost' | undefined
        >;
        getIsViewOnlyByDefaultEnabled: Getter<[], boolean>;
        getThpSettings: Getter<[], ThpSettings>;
    } & ReportSecurityCheckDep &
    ReloadAppDep &
    MigrateSuiteSyncLabelsForRbfTransactionDep &
    CreateLoggerDep &
    ThpHostNameDep &
    TransportsDep;
