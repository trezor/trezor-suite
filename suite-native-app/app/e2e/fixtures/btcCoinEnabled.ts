import { PreloadedState } from '@suite-native-app/state';

/**
 *  reflects state after BTC coin enabling.
 */
export const btcCoinEnabled: PreloadedState = {
    wallet: {
        settings: {
            enabledNetworks: ['btc'],
        },
    },
};
