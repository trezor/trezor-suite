import { PreloadedState } from '@suite-native/state';

export const btcWalletPreloaded: PreloadedState = {
    wallet: {
        accounts: [
            {
                accountLabel: 'BTC SegWit',
                accountType: 'normal',
                availableBalance: '0',
                balance: '0',
                descriptor:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                deviceState: 'state@hiddenDeviceWithImportedAccounts:1',
                empty: false,
                formattedBalance: '0',
                imported: true,
                index: 0,
                key: 'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT-btc-state@hiddenDeviceWithImportedAccounts:1',
                networkType: 'bitcoin',
                symbol: 'btc',
                tokens: [],
                ts: 1753692438941,
                utxo: [],
                visible: true,
            },
        ],
    },
};
