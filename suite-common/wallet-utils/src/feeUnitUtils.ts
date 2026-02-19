import type { NetworkType } from '@suite-common/wallet-config';

const mapNetworkTypeToFeeUnits: Record<NetworkType, string> = {
    bitcoin: 'sat/vB',
    cardano: 'Lovelaces/B',
    ethereum: 'Gwei',
    ripple: 'Drops',
    solana: 'Lamports',
    stellar: 'Stroops',
    tron: 'Sun',
};

export const getFeeUnits = (networkType: NetworkType) => mapNetworkTypeToFeeUnits[networkType];
