import { type TxKeyPath } from '@suite-native/intl';
import { type ExperimentalFeature } from '@suite-native/settings';

export type ExperimentalFeatureConfig = {
    titleKey: TxKeyPath;
    descriptionKey: TxKeyPath;
};

/** Settings toggles for experimental features (Suite Sync is controlled via the message system). */
export const EXPERIMENTAL_FEATURES: Partial<
    Record<ExperimentalFeature, ExperimentalFeatureConfig>
> = {};

/** Titles for post-usage feedback (e.g. after Suite Sync labeling actions). */
export const FEEDBACK_FEATURE_CONFIGS: Record<ExperimentalFeature, { titleKey: TxKeyPath }> = {
    'suite-sync': {
        titleKey: 'moduleSettings.advanced.experimentalFeatures.suiteSync.title',
    },
    'tron-view-only': {
        titleKey: 'moduleSettings.experimental.tronViewOnly.title',
    },
};
