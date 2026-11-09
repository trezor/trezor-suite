import { type DesktopAnalyticsDep } from '@suite/analytics';
import { type BluetoothDep } from '@suite/bluetooth';
import { type DesktopApiDep } from '@suite/desktop-app-api';
import { type MetadataMigrationDep } from '@suite/metadata-migration';
import { type SuiteRouterHistoryDep } from '@suite/router';
import { type TransportsDep } from '@suite-common/connect-init';
import { type CommonServices } from '@suite-common/extra-dependencies';
import { type TransactionRetrieverDep } from '@suite-common/wallet-core';
import { type DbDep } from '@trezor/suite';

export type SuiteServices = CommonServices &
    DbDep &
    DesktopApiDep &
    DesktopAnalyticsDep &
    MetadataMigrationDep &
    SuiteRouterHistoryDep &
    TransportsDep &
    BluetoothDep &
    TransactionRetrieverDep;
