import { FieldValues } from 'react-hook-form';

import type { DBSchema } from 'idb';

import { AnalyticsState } from '@suite-common/analytics';
import { AppRememberedPermission } from '@suite-common/connect-popup/src/connectPopupTypes';
import type { MessageState } from '@suite-common/message-system';
import type { DeviceWithEmptyPath, MessageSystem } from '@suite-common/suite-types';
import { SimpleTokenStructure } from '@suite-common/token-definitions';
import type { TradingTransaction } from '@suite-common/trading';
import { Explorer, NetworkSymbol } from '@suite-common/wallet-config';
import { DeviceReducerState } from '@suite-common/wallet-core';
import type {
    BackendSettings,
    FormState,
    RatesByTimestamps,
    WalletSettings,
} from '@suite-common/wallet-types';

import type { SuiteState } from 'src/reducers/suite/suiteReducer';
import type { MetadataState } from 'src/types/suite/metadata';
import type { Account, Discovery, WalletAccountTransaction } from 'src/types/wallet';
import { CoinjoinAccount, CoinjoinDebugSettings } from 'src/types/wallet/coinjoin';

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
    explorer: {
        key: NetworkSymbol;
        value: { symbol: NetworkSymbol; explorer: Explorer };
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
            evmSettings: SuiteState['evmSettings'];
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
    tradingTrades: {
        key: string;
        value: TradingTransaction;
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
    security: {
        key: 'security';
        value: {
            devicesWithFailedEntropyCheck: DeviceReducerState['devicesWithFailedEntropyCheck'];
        };
    };
    connect: {
        key: 'connect';
        value: {
            permissions: AppRememberedPermission[];
        };
    };
}
