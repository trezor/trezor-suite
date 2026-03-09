import { FieldValues } from 'react-hook-form';

import type { DBSchema } from 'idb';

import { AnalyticsState } from '@suite-common/analytics-redux';
import { AppRememberedPermission } from '@suite-common/connect-popup/src/connectPopupTypes';
import { ExperimentalFeedbackState } from '@suite-common/feedback';
import type { MessageState } from '@suite-common/message-system';
import type { MetadataState } from '@suite-common/metadata-types';
import { EncryptedHex } from '@suite-common/platform-encryption';
import type { SuiteSyncQuotaManagerState } from '@suite-common/suite-sync-quota-manager';
import { SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import type {
    DeviceWithEmptyPath,
    MessageSystem,
    PersistentDeviceData,
    ThpSuiteCredentials,
} from '@suite-common/suite-types';
import { SimpleTokenStructure } from '@suite-common/token-definitions';
import type { TradingTransaction } from '@suite-common/trading';
import { Explorer, NetworkSymbol } from '@suite-common/wallet-config';
import type {
    AccountKey,
    BackendSettings,
    FormState,
    RatesByTimestamps,
    WalletSettings,
} from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';
import { FirmwareChannel } from '@trezor/connect/src/types/firmware';

import type { BioAuthState } from 'src/reducers/bioAuth';
import type { SuiteState } from 'src/reducers/suite/suiteReducer';
import type { Account, WalletAccountTransaction } from 'src/types/wallet';
import { CoinjoinAccount, CoinjoinDebugSettings } from 'src/types/wallet/coinjoin';

import { DesktopBluetoothDevice } from '../actions/bluetooth/DesktopBluetoothDevice';
import { DesktopSuiteSyncState } from '../actions/suiteSync/suiteSyncSlice';
import { GraphData } from '../types/wallet/graph';

export interface DBWalletAccountTransaction {
    tx: WalletAccountTransaction;
    order: number;
}

export interface SuiteDBSchema extends DBSchema {
    bioAuth: {
        key: 'bioAuth';
        value: Pick<BioAuthState, 'bioAuthEnabled'>;
    };
    txs: {
        key: string;
        value: DBWalletAccountTransaction;
        indexes: {
            accountKey: string[]; // descriptor, symbol, deviceState
            txid: WalletAccountTransaction['txid'];
            deviceState: string;
            order: number;
            blockTime: number; // TODO: blockTime can be undefined
        };
    };
    explorer: {
        key: NetworkSymbol;
        value: { symbol: NetworkSymbol; explorer: Explorer };
    };
    sendFormDrafts: {
        key: AccountKey;
        value: FormState;
    };
    suiteSettings: {
        key: string;
        value: {
            settings: SuiteState['settings'];
            flags: SuiteState['flags'];
            evmSettings: SuiteState['evmSettings'];
            seenDisconnectNotificationForDeviceIds: SuiteState['seenDisconnectNotificationForDeviceIds'];
        };
    };
    historicRates: {
        key: string;
        value: RatesByTimestamps;
    };
    walletSettings: {
        key: string;
        value: WalletSettings;
    };
    backendSettings: {
        key: NetworkSymbol;
        value: BackendSettings;
    };
    devices: {
        key: string;
        value: DeviceWithEmptyPath;
    };
    thp: {
        key: string;
        value: {
            credentials: ThpSuiteCredentials[];
        };
    };
    bluetooth: {
        key: string;
        value: {
            knownDevices: DesktopBluetoothDevice[];
        };
    };
    accounts: {
        key: string[];
        value: Account;
        indexes: {
            deviceState: string;
        };
    };
    tokenManagement: {
        key: string;
        value: SimpleTokenStructure;
    };
    coinjoinAccounts: {
        key: string; // accountKey
        value: CoinjoinAccount;
    };
    coinjoinDebugSettings: {
        key: 'debug';
        value: CoinjoinDebugSettings;
    };
    analytics: {
        key: string;
        value: AnalyticsState;
    };
    graph: {
        key: string[]; // descriptor, symbol, deviceState, interval
        value: GraphData;
        indexes: {
            accountKey: string[]; // descriptor, symbol, deviceState
            deviceState: string;
        };
    };
    tradingTrades: {
        key: string;
        value: TradingTransaction;
    };
    metadata: {
        key: 'state';
        value: MetadataState;
    };
    suiteSyncSettings: {
        key: 'suiteSyncSettings';
        value: DesktopSuiteSyncState['settings'];
    };
    suiteSyncOwners: {
        key: StaticSessionId;
        value: EncryptedHex<SuiteSyncOwnerSerialized>;
    };
    suiteSyncQuotaManager: {
        key: 'suiteSyncQuotaManager';
        value: SuiteSyncQuotaManagerState;
    };
    messageSystem: {
        key: string;
        value: {
            currentSequence: number;
            config: MessageSystem | null;
            dismissedMessages: {
                [key: string]: MessageState;
            };
        };
    };
    formDrafts: {
        key: string;
        value: FieldValues;
    };
    firmware: {
        key: 'firmware';
        value: {
            firmwareChannel: FirmwareChannel;
        };
    };
    persistentDeviceData: {
        key: 'persistentDeviceData';
        value: PersistentDeviceData[];
    };
    connect: {
        key: 'connect';
        value: {
            permissions: AppRememberedPermission[];
        };
    };
    experimentalFeedback: {
        key: 'experimentalFeedback';
        value: ExperimentalFeedbackState;
    };
}
