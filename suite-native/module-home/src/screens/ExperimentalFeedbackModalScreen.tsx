import { useDispatch } from 'react-redux';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { Text, VStack } from '@suite-native/atoms';
import {
    EXPERIMENTAL_FEATURES,
    ExperimentalFeatureRatingForm,
    feedbackDismissed,
} from '@suite-native/experimental-features';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.ExperimentalFeedbackModal>;

export const ExperimentalFeedbackModalScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const route = useRoute<RouteProps>();
    const { feature } = route.params;

    if (!feature || !EXPERIMENTAL_FEATURES[feature]) {
        navigation.goBack();

        return null;
    }

    const { titleKey } = EXPERIMENTAL_FEATURES[feature];

    const handleSubmit = (rating: Rating, description: string) => {
        const userData = buildUserFeedbackData();

        dispatch(
            sendFeedbackAction({
                type: 'SUGGESTION',
                payload: {
                    category: 'experimental',
                    description,
                    rating,
                    feature,
                    ...userData,
                },
            }),
        );
        dispatch(feedbackDismissed(feature));
    };

    const handleDismiss = () => {
        navigation.goBack();
    };

    return (
        <Screen header={<ScreenHeader />}>
            <VStack spacing="sp32">
                <Text variant="headline-md">
                    <Translation
                        id="moduleSettings.advanced.experimentalFeatures.feedback.title"
                        values={{ featureName: <Translation id={titleKey} /> }}
                    />
                </Text>
                <ExperimentalFeatureRatingForm
                    feature={feature}
                    onSubmit={handleSubmit}
                    onDismiss={handleDismiss}
                />
            </VStack>
        </Screen>
    );
};
