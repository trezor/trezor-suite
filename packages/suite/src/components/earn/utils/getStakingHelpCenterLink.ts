import { type NetworkType } from '@suite-common/wallet-config';
import {
    HELP_CENTER_ADA_STAKING,
    HELP_CENTER_ETH_STAKING,
    HELP_CENTER_SOL_STAKING,
} from '@trezor/urls';

export const getStakingHelpCenterLink = (networkType?: NetworkType) => {
    switch (networkType) {
        case 'ethereum':
            return HELP_CENTER_ETH_STAKING;
        case 'solana':
            return HELP_CENTER_SOL_STAKING;
        case 'cardano':
            return HELP_CENTER_ADA_STAKING;
        default:
            return undefined;
    }
};
