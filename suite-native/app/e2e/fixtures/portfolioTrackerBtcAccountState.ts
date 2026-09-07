import { Account, type AccountKey } from '@suite-common/wallet-types';
import { PreloadedState } from '@suite-native/state';

export const PRELOADED_BTC_ACCOUNT_LABEL = 'BTC SegWit';
export const PRELOADED_BTC_ACCOUNT_DESCRIPTOR =
    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT';
export const PRELOADED_BTC_DEVICE_STATE = 'state@hiddenDeviceWithImportedAccounts:1';
export const PRELOADED_BTC_ACCOUNT_KEY =
    `${PRELOADED_BTC_ACCOUNT_DESCRIPTOR}-btc-${PRELOADED_BTC_DEVICE_STATE}` as AccountKey;

/**
 * State fragment that inserts BTC account to a portfolio tracker wallet.
 */
export const portfolioTrackerBtcAccountState: PreloadedState = {
    wallet: {
        accounts: [
            {
                accountLabel: PRELOADED_BTC_ACCOUNT_LABEL,
                accountType: 'normal',
                addresses: [],
                availableBalance: '0',
                balance: '0',
                descriptor: PRELOADED_BTC_ACCOUNT_DESCRIPTOR,
                deviceState: PRELOADED_BTC_DEVICE_STATE,
                empty: false,
                formattedBalance: '0',
                history: [],
                imported: true,
                index: 0,
                key: PRELOADED_BTC_ACCOUNT_KEY,
                metadata: [],
                networkType: 'bitcoin',
                page: [],
                path: '',
                symbol: 'btc',
                tokens: [],
                ts: 1753692438941,
                utxo: [],
                visible: true,
            } as unknown as Account, // to omit unnecessary fields,
        ],
    },
};
