import { PreloadedState } from '@suite-native/state';

/**
 *  reflects state after BTC coin enabling.
 */
export const btcCoinEnabled: PreloadedState = {
    appSettings: {
        isCoinEnablingInitFinished: true,
    },
    wallet: {
        settings: {
            enabledNetworks: ['btc'],
        },
    },
};
