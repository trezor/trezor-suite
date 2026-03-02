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
    | 'suite-sync'
    | 'tron-view-only';

/**
 * Maps Experimental feature to its generic product name TranslationKey.
 */
export const translatedExperimentalFeatures: ExperimentalFeatureTranslation = {
    'suite-sync': 'TR_EXPERIMENTAL_SUITE_SYNC_TITLE',
    'experimental-networks': 'TR_EXPERIMENTAL_NETWORKS',
    'nft-section': 'TR_EXPERIMENTAL_NFT_SECTION',
    'tor-external': 'TR_EXPERIMENTAL_TOR_EXTERNAL',
    'password-manager': 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
    'testnet-networks': 'TR_EXPERIMENTAL_TESTNET_NETWORKS',
    slip24: 'TR_EXPERIMENTAL_SLIP24',
    'tron-view-only': 'TR_EXPERIMENTAL_TRON_VIEW_ONLY',
};
