import { type NetworkType } from '@suite-common/wallet-config';

export const getStakingGuideLink = (networkType?: NetworkType) => {
    switch (networkType) {
        case 'ethereum':
            return '/earn/staking/ethereum-eth-staking.md';
        case 'solana':
            return '/earn/staking/solana-sol-staking.md';
        case 'cardano':
            return '/earn/staking/cardano-ada-staking.md';
        default:
            return undefined;
    }
};
