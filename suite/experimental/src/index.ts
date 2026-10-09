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

export type FeedbackFeatureName = ExperimentalFeature | 'suite-sync' | 'stablecoin-yield';
