import { PreloadedState } from '@suite-native/state';

/**
 *  reflects state after ETH coin enabling.
 */
export const ethCoinEnabled: PreloadedState = {
    wallet: {
        settings: {
            enabledNetworks: ['eth'],
        },
    },
};
