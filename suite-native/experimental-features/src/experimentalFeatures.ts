import { type TxKeyPath } from '@suite-native/intl';
import { type NativeServices } from '@suite-native/services';
import { type ExperimentalFeature } from '@suite-native/settings';

export type ExperimentalFeatureConfig = {
    titleKey: TxKeyPath;
    descriptionKey: TxKeyPath;
    onToggle?: ({ newValue, services }: { newValue: boolean; services: NativeServices }) => void;
};

export const EXPERIMENTAL_FEATURES: Record<ExperimentalFeature, ExperimentalFeatureConfig> = {
    'suite-sync': {
        titleKey: 'moduleSettings.advanced.experimentalFeatures.suiteSync.title',
        descriptionKey: 'moduleSettings.advanced.experimentalFeatures.suiteSync.description',
        onToggle: ({ newValue, services }) => {
            if (!newValue) {
                // Turn off Suite Sync
                services.suiteSync.turnOffSuiteSync();
            }
        },
    },
};
