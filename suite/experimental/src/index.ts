import type { TranslationKey } from '@suite/intl';

type ExperimentalFeatureTranslation = {
    [key in ExperimentalFeature]: TranslationKey;
};

export type ExperimentalFeature =
    | 'password-manager'
    | 'tor-external'
    | 'testnet-networks'
    | 'nft-section'
    | 'slip24'
    | 'experimental-networks'
    | 'tron-view-only'
    | 'mcp-server';

/**
 * Set of features that are truly experimental (as opposed to regular features
 * behind a feature toggle). Used to determine the feedback category.
 */
export const experimentalFeatureSet: ReadonlySet<ExperimentalFeature> =
    new Set<ExperimentalFeature>([
        'password-manager',
        'tor-external',
        'testnet-networks',
        'nft-section',
        'slip24',
        'experimental-networks',
        'tron-view-only',
    ]);

/**
 * Maps Experimental feature to its generic product name TranslationKey.
 */
export const translatedExperimentalFeatures: ExperimentalFeatureTranslation = {
    'experimental-networks': 'TR_EXPERIMENTAL_NETWORKS',
    'nft-section': 'TR_EXPERIMENTAL_NFT_SECTION',
    'tor-external': 'TR_EXPERIMENTAL_TOR_EXTERNAL',
    'password-manager': 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
    'testnet-networks': 'TR_EXPERIMENTAL_TESTNET_NETWORKS',
    slip24: 'TR_EXPERIMENTAL_SLIP24',
    'tron-view-only': 'TR_EXPERIMENTAL_TRON_VIEW_ONLY',
    'mcp-server': 'TR_EXPERIMENTAL_MCP_SERVER',
};

export type FeedbackFeatureName = ExperimentalFeature | 'suite-sync' | 'stablecoin-yield';

type FeedbackFeatureTranslation = {
    [key in FeedbackFeatureName]: TranslationKey;
};

export const translatedFeedbackFeatures: FeedbackFeatureTranslation = {
    ...translatedExperimentalFeatures,
    'suite-sync': 'TR_EXPERIMENTAL_SUITE_SYNC_TITLE',
    'stablecoin-yield': 'TR_EARN_STABLECOIN_YIELD_TITLE',
};
