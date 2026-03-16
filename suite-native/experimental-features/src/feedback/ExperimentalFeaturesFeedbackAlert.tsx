import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { type NavigationProp, useNavigation } from '@react-navigation/native';

import { AnimatedFullAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type RootStackParamList, RootStackRoutes } from '@suite-native/navigation';
import { type ExperimentalFeature } from '@suite-native/settings';

import { EXPERIMENTAL_FEATURES } from '../experimentalFeatures';
import { feedbackDismissed } from './experimentalFeedbackSlice';

type ExperimentalFeaturesFeedbackAlertProps = {
    pendingFeature: ExperimentalFeature;
};

export const ExperimentalFeaturesFeedbackAlert = ({
    pendingFeature,
}: ExperimentalFeaturesFeedbackAlertProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const handleRate = useCallback(() => {
        navigation.navigate(RootStackRoutes.ExperimentalFeedbackModal, {
            feature: pendingFeature,
        });
    }, [navigation, pendingFeature]);

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
            onPressPrimaryButton={handleRate}
            onPressSecondaryButton={handleDismiss}
        />
    );
};
