import type { TranslationKey } from '@suite-common/intl-types';
import type { NetworkFeature, NetworkType } from '@suite-common/wallet-config';

export const getCoinLabel = (
    features: NetworkFeature[],
    isTestnet: boolean,
    isCustomBackend: boolean,
    networkType?: NetworkType,
    isDebug?: boolean,
): TranslationKey | undefined => {
    const hasTokens = features.includes('tokens');
    // TODO: Remove this condition when Solana staking is available
    const hasStaking =
        networkType === 'solana'
            ? isDebug && features.includes('staking') // Solana staking only in debug mode
            : features.includes('staking');

    if (isCustomBackend) {
        return 'TR_CUSTOM_BACKEND';
    } else if (isTestnet) {
        return 'TR_TESTNET_COINS_LABEL';
    } else if (hasTokens && hasStaking) {
        return 'TR_INCLUDING_TOKENS_AND_STAKING';
    } else if (hasTokens) {
        return 'TR_INCLUDING_TOKENS';
    }
};
