import { type FeedbackFeatureName } from '@suite/experimental';
import { type TranslationKey } from '@suite/intl';

/**
 * Maps a feature that can collect feedback to the translation key of its generic product name.
 */
export const translatedFeedbackFeatures: Record<FeedbackFeatureName, TranslationKey> = {
    'experimental-networks': 'TR_EXPERIMENTAL_NETWORKS',
    'tor-external': 'TR_EXPERIMENTAL_TOR_EXTERNAL',
    'password-manager': 'TR_EXPERIMENTAL_PASSWORD_MANAGER',
    slip24: 'TR_EXPERIMENTAL_SLIP24',
    'mcp-server': 'TR_EXPERIMENTAL_MCP_SERVER',
    'gap-limit': 'TR_EXPERIMENTAL_GAP_LIMIT',
    'suite-sync': 'TR_EXPERIMENTAL_SUITE_SYNC_TITLE',
    'stablecoin-yield': 'TR_EARN_DEFI_YIELD_TITLE',
};
