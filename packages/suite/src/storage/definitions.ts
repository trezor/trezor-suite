import { StorageUpdateMessage } from '@trezor/suite-storage';
import { DBSchema } from 'idb';
import { State as WalletSettings } from '@wallet-reducers/settingsReducer';
import { SuiteState } from '@suite-reducers/suiteReducer';
import { State as AnalyticsState } from '@suite-reducers/analyticsReducer';
import { FormState } from '@wallet-types/sendForm';
import { AcquiredDevice } from '@suite-types';
import { MetadataState } from '@suite-types/metadata';
import { Account, Discovery, CoinFiatRates, WalletAccountTransaction } from '@wallet-types';
import { GraphData } from '@wallet-types/graph';
import { BuyTrade, ExchangeTrade } from 'invity-api';

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
        value: {
            key?: string;
            date: string;
            tradeType: 'buy' | 'exchange';
            data: BuyTrade | ExchangeTrade;
            account: {
                descriptor?: Account['descriptor'];
                symbol: Account['symbol'];
                accountIndex: Account['index'];
                accountType: Account['accountType'];
            };
        };
    };
    metadata: {
        key: 'state';
        value: MetadataState;
    };
}

export type SuiteStorageUpdateMessage = StorageUpdateMessage<SuiteDBSchema>;
