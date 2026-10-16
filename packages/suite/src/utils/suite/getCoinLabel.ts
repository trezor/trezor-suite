import type { NetworkFeature } from '@suite-common/wallet-config';
import type { TranslationKey } from '@suite-lego/intl';

export const getCoinLabel = (
    features: NetworkFeature[],
    isTestnet: boolean,
): TranslationKey | undefined => {
    const hasTokens = features.includes('tokens');
    const hasStaking = features.includes('staking');

    if (isTestnet) {
        return 'TR_TESTNET_COINS_LABEL';
    } else if (hasTokens && hasStaking) {
        return 'TR_INCLUDING_TOKENS_AND_STAKING';
    } else if (hasTokens) {
        return 'TR_INCLUDING_TOKENS';
    }
};
