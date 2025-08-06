// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Although some fields don't satisfy the expected types, this is the bare minimum required for the trading buy flow to render and display the address correctly.
import { PreloadedState } from '@suite-native/state';

export const btcWalletPreloaded: PreloadedState = {
    wallet: {
        accounts: [
            {
                accountLabel: 'BTC SegWit',
                accountType: 'normal',
                addresses: [],
                availableBalance: '0',
                balance: '0',
                descriptor:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                deviceState: 'state@hiddenDeviceWithImportedAccounts:1',
                empty: false,
                formattedBalance: '0',
                history: [],
                imported: true,
                index: 0,
                key: 'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT-btc-state@hiddenDeviceWithImportedAccounts:1',
                metadata: [],
                networkType: 'bitcoin',
                page: [],
                path: '',
                symbol: 'btc',
                tokens: [],
                ts: 1753692438941,
                utxo: [],
                visible: true,
            },
        ],
    },
};
