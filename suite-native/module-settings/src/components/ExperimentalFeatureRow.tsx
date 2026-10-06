import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { EXPERIMENTAL_FEATURES } from '@suite-native/experimental-features';
import { feedbackRequested } from '@suite-native/feature-feedback';
import { Translation } from '@suite-native/intl';
import {
    type ExperimentalFeature,
    type SettingsSliceRootState,
    selectIsExperimentalFeatureEnabled,
    toggleExperimentalFeature,
} from '@suite-native/settings';

type ExperimentalFeatureRowProps = {
    feature: ExperimentalFeature;
};

export const ExperimentalFeatureRow = ({ feature }: ExperimentalFeatureRowProps) => {
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const isFeatureEnabled = useSelector((state: SettingsSliceRootState) =>
        selectIsExperimentalFeatureEnabled(state, feature),
    );

    const config = EXPERIMENTAL_FEATURES[feature];

    if (!config) {
        return null;
    }

    const handleToggle = (value: boolean) => {
        dispatch(toggleExperimentalFeature(feature));

        if (!value) {
            dispatch(feedbackRequested({ feature, isFeatureBeingDisabled: true }));
        }

        analytics.report({
            type: events.settingsToggleExperimentalFeatureEvent.name,
            payload: { feature, value },
        });
    };

    return (
        <TouchableSwitchRow
            icon={config.icon}
            isChecked={isFeatureEnabled}
            onChange={handleToggle}
            text={<Translation id={config.titleKey} />}
            description={<Translation id={config.descriptionKey} />}
            accessibilityLabel={`${feature} toggle`}
            testID={`settings/experimental-${feature}-touchable-row`}
        />
    );
};
