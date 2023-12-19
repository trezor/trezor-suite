import type { DBSchema } from 'idb';
import { FieldValues } from 'react-hook-form';

import type { SuiteState } from 'src/reducers/suite/suiteReducer';
import type { FormState } from 'src/types/wallet/sendForm';
import type { AcquiredDevice } from 'src/types/suite';
import type { MetadataState } from 'src/types/suite/metadata';
import type { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import type { MessageState } from '@suite-common/message-system';
import type { MessageSystem } from '@suite-common/suite-types';
import type { Account, Discovery, Network, WalletAccountTransaction } from 'src/types/wallet';
import type { CoinjoinAccount, CoinjoinDebugSettings } from 'src/types/wallet/coinjoin';

import type { BackendSettings, WalletSettings } from '@suite-common/wallet-types';
import type { StorageUpdateMessage } from '@trezor/suite-storage';
import { AnalyticsState } from '@suite-common/analytics';
import { GraphData } from '../types/wallet/graph';

export interface DBWalletAccountTransaction {
    tx: WalletAccountTransaction;
    order: number;
}

export interface SuiteDBSchema extends DBSchema {
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
    sendFormDrafts: {
        key: string; // accountKey
        value: FormState;
    };
    suiteSettings: {
        key: string;
        value: {
            settings: SuiteState['settings'];
            flags: SuiteState['flags'];
        };
    };
    walletSettings: {
        key: string;
        value: WalletSettings;
    };
    backendSettings: {
        key: Network['symbol'];
        value: BackendSettings;
    };
    devices: {
        key: string;
        value: AcquiredDevice;
    };
    accounts: {
        key: string[];
        value: Account;
        indexes: {
            deviceState: string;
        };
    };
    coinjoinAccounts: {
        key: string; // accountKey
        value: CoinjoinAccount;
    };
    coinjoinDebugSettings: {
        key: 'debug';
        value: CoinjoinDebugSettings;
    };
    discovery: {
        key: string;
        value: Discovery;
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
    coinmarketTrades: {
        key: string;
        value: Trade;
    };
    metadata: {
        key: 'state';
        value: MetadataState;
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
            firmwareHashInvalid: string[];
        };
    };
}

export type SuiteStorageUpdateMessage = StorageUpdateMessage<SuiteDBSchema>;
