import type { TranslationKey } from '@suite-common/intl-types';
import type { NetworkFeature } from '@suite-common/wallet-config';

export const getCoinLabel = (
    features: NetworkFeature[],
    isTestnet: boolean,
    isCustomBackend: boolean,
): TranslationKey | undefined => {
    const hasTokens = features.includes('tokens');
    const hasStaking = features.includes('staking');

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
