import type { TranslationKey } from '@suite/intl';

type ExperimentalFeatureTranslation = {
    [key in ExperimentalFeature]: TranslationKey;
};

export type ExperimentalFeature =
    | 'password-manager'
    | 'tor-external'
    | 'slip24'
    | 'experimental-networks'
    | 'mcp-server'
    | 'gap-limit';

/**
 * Set of features that are truly experimental (as opposed to regular features
 * behind a feature toggle). Used to determine the feedback category.
 */
export const experimentalFeedbackFeatureSet: ReadonlySet<ExperimentalFeature> =
    new Set<ExperimentalFeature>([
        'password-manager',
        'tor-external',
        'slip24',
        'experimental-networks',
    ]);

/**
 * Maps Experimental feature to its generic product name TranslationKey.
 */
export const translatedExperimentalFeatures: ExperimentalFeatureTranslation = {
    'experimental-networks': 'TR_EXPERIMENTAL_NETWORKS',
    'tor-external': 'TR_EXPERIMENTAL_TOR_EXTERNAL',
    'password-manager': 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
    slip24: 'TR_EXPERIMENTAL_SLIP24',
    'mcp-server': 'TR_EXPERIMENTAL_MCP_SERVER',
    'gap-limit': 'TR_EXPERIMENTAL_GAP_LIMIT',
};

export type FeedbackFeatureName = ExperimentalFeature | 'suite-sync' | 'stablecoin-yield';

type FeedbackFeatureTranslation = {
    [key in FeedbackFeatureName]: TranslationKey;
};

export const translatedFeedbackFeatures: FeedbackFeatureTranslation = {
    ...translatedExperimentalFeatures,
    'suite-sync': 'TR_EXPERIMENTAL_SUITE_SYNC_TITLE',
    'stablecoin-yield': 'TR_EARN_DEFI_YIELD_TITLE',
};
