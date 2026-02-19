// eslint-disable-next-line local-rules/no-package-deep-imports
import type { NetworkType } from '@suite-common/wallet-config/src/types';

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
