import { Account } from 'src/types/wallet';
import coinmarketReducer from 'src/reducers/wallet/coinmarketReducer';
import selectedAccountReducer from 'src/reducers/wallet/selectedAccountReducer';
import { transactionsReducer } from 'src/reducers/wallet';

export const ACCOUNT: Account = {
    networkType: 'bitcoin',
    symbol: 'btc' as Account['symbol'],
    descriptor: 'btc-descriptor',
    deviceState: 'C5B245DD2B69C7291:1',
    index: 0,
    path: "m/84'/0'/0'",
    key: 'descriptor-btc-C5B245DD2B69C7291:1',
    accountType: 'normal',
    empty: true,
    visible: true,
    balance: '12340000',
    availableBalance: '12340000',
    formattedBalance: '0.12340000',
    tokens: [],
    addresses: {
        change: [],
        used: [],
        unused: [
            {
                address: 'bc1q5y487p64hfsjc5gdfeezv29zwcddz5kahve0kp',
                path: "m/84'/0'/0'/0/0",
                transfers: 0,
            },
        ],
    },
    utxo: [],
    history: {
        total: 0,
        unconfirmed: 0,
    },
    metadata: {
        key: 'C5B245DD2B69C7291',
        fileName: '',
        aesKey: '',
        outputLabels: {},
        addressLabels: {},
    },
    page: undefined,
    misc: undefined,
    marker: undefined,
};

export const DEFAULT_STORE = {
    wallet: {
        coinmarket: coinmarketReducer(undefined, { type: 'foo' } as any),
        selectedAccount: selectedAccountReducer(undefined, { type: 'foo' } as any),
        transactions: transactionsReducer(undefined, { type: 'foo' } as any),
    },
    suite: {
        device: undefined,
    },
};
