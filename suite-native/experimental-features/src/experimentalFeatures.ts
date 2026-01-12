import { Dispatch } from '@reduxjs/toolkit';

import { suiteSyncActions } from '@suite-common/suite-sync';
import { TxKeyPath } from '@suite-native/intl';
import { NativeServices } from '@suite-native/services';
import { ExperimentalFeature } from '@suite-native/settings';

export type ExperimentalFeatureConfig = {
    titleKey: TxKeyPath;
    descriptionKey: TxKeyPath;
    onToggle?: ({ newValue, dispatch, services }: { newValue: boolean; dispatch: Dispatch; services: NativeServices }) => void;
};

export const EXPERIMENTAL_FEATURES: Record<ExperimentalFeature, ExperimentalFeatureConfig> = {
    'suite-sync': {
        titleKey: 'moduleSettings.advanced.experimentalFeatures.suiteSync.title',
        descriptionKey: 'moduleSettings.advanced.experimentalFeatures.suiteSync.description',
        onToggle: ({ newValue, dispatch, services }) => {
            if (!newValue) {
                services.suiteSync.turnOffSuiteSync();
            }
            dispatch(
                suiteSyncActions.updateIsFeatureSuiteSyncAvailable({
                    isShownInSettings: newValue,
                }),
            );
        },
    },
};
