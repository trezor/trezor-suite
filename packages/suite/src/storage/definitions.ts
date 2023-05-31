import type { DBSchema } from 'idb';
import type { SuiteState } from '@suite-reducers/suiteReducer';
import type { FormState } from '@wallet-types/sendForm';
import type { AcquiredDevice } from '@suite-types';
import type { MetadataState } from '@suite-types/metadata';
import type { Trade } from '@wallet-types/coinmarketCommonTypes';
import type { MessageState } from '@suite-common/message-system';
import type { MessageSystem } from '@suite-common/suite-types';
import type { FormDraft } from '@wallet-types/form';
import type {
    Account,
    Discovery,
    Network,
    CoinFiatRates,
    WalletAccountTransaction,
} from '@wallet-types';
import type { CoinjoinAccount, CoinjoinDebugSettings } from '@wallet-types/coinjoin';

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
    fiatRates: {
        key: string;
        value: CoinFiatRates;
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
        value: FormDraft;
    };
    firmware: {
        key: 'firmware';
        value: {
            firmwareHashInvalid: string[];
        };
    };
}

export type SuiteStorageUpdateMessage = StorageUpdateMessage<SuiteDBSchema>;
