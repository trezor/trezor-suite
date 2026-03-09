import { useDispatch } from 'react-redux';

import { AnimatedFullAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ExperimentalFeature } from '@suite-native/settings';

import { EXPERIMENTAL_FEATURES } from '../experimentalFeatures';
import { feedbackDismissed } from './experimentalFeedbackSlice';

type ExperimentalFeaturesFeedbackAlertProps = {
    pendingFeature: ExperimentalFeature;
    onRate: () => void;
};

export const ExperimentalFeaturesFeedbackAlert = ({
    pendingFeature,
    onRate,
}: ExperimentalFeaturesFeedbackAlertProps) => {
    const dispatch = useDispatch();

    const handleDismiss = () => {
        dispatch(feedbackDismissed(pendingFeature));
    };

    const { titleKey } = EXPERIMENTAL_FEATURES[pendingFeature];

    return (
        <AnimatedFullAlertBox
            marginHorizontal="sp16"
            iconName="smiley"
            title={
                <Translation
                    id="moduleSettings.advanced.experimentalFeatures.feedback.title"
                    values={{ featureName: <Translation id={titleKey} /> }}
                />
            }
            description={
                <Translation id="moduleSettings.advanced.experimentalFeatures.feedback.description" />
            }
            primaryButtonLabel={
                <Translation id="moduleSettings.advanced.experimentalFeatures.feedback.rateButton" />
            }
            secondaryButtonLabel={
                <Translation id="moduleSettings.advanced.experimentalFeatures.feedback.dismissButton" />
            }
            onPressPrimaryButton={onRate}
            onPressSecondaryButton={handleDismiss}
        />
    );
};
