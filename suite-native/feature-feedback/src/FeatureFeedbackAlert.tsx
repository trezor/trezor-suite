import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { type NavigationProp, useNavigation } from '@react-navigation/native';

import { AnimatedFullAlertBox } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type RootStackParamList, RootStackRoutes } from '@suite-native/navigation';
import { type ExperimentalFeature } from '@suite-native/settings';

import { feedbackDismissed } from './featureFeedbackSlice';

type FeatureFeedbackAlertProps = {
    pendingFeature: ExperimentalFeature;
    featureTitleKey: TxKeyPath;
};

export const FeatureFeedbackAlert = ({
    pendingFeature,
    featureTitleKey,
}: FeatureFeedbackAlertProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const handleRate = useCallback(() => {
        navigation.navigate(RootStackRoutes.FeatureFeedbackModal, {
            feature: pendingFeature,
        });
    }, [navigation, pendingFeature]);

    const handleDismiss = () => {
        dispatch(feedbackDismissed(pendingFeature));
    };

    return (
        <AnimatedFullAlertBox
            marginHorizontal="sp16"
            iconName="smiley"
            title={
                <Translation
                    id="moduleSettings.advanced.featureFeedback.title"
                    values={{ featureName: <Translation id={featureTitleKey} /> }}
                />
            }
            description={<Translation id="moduleSettings.advanced.featureFeedback.description" />}
            primaryButtonLabel={
                <Translation id="moduleSettings.advanced.featureFeedback.rateButton" />
            }
            secondaryButtonLabel={
                <Translation id="moduleSettings.advanced.featureFeedback.dismissButton" />
            }
            onPressPrimaryButton={handleRate}
            onPressSecondaryButton={handleDismiss}
        />
    );
};
