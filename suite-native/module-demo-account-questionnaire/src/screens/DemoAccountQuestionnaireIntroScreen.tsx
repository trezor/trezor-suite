import { useNavigation } from '@react-navigation/native';

import { EventType } from '@suite-native/analytics';
import { Button, InlineAlertBox, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DemoAccountQuestionnaireStackParamList,
    DemoAccountQuestionnaireStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useLegacyAnalytics } from '@suite-native/services';

export const DemoAccountQuestionnaireIntroScreen = () => {
    const legacyAnalytics = useLegacyAnalytics();
    const navigation =
        useNavigation<
            StackNavigationProps<
                DemoAccountQuestionnaireStackParamList,
                DemoAccountQuestionnaireStackRoutes.Intro
            >
        >();

    const handleContinue = () => {
        legacyAnalytics.report({ type: EventType.DemoAccountQuestionnaireStart }, { force: true });
        navigation.navigate(DemoAccountQuestionnaireStackRoutes.Reason);
    };

    const handleExit = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <Screen header={<ScreenHeader closeActionType="back" />}>
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp24" alignItems="center" justifyContent="center" flex={1}>
                    <VStack justifyContent="center">
                        <PictogramTitleHeader
                            variant="success"
                            icon="handWaving"
                            title={<Translation id="moduleDemoAccountQuestionnaire.intro.title" />}
                            subtitle={
                                <Translation id="moduleDemoAccountQuestionnaire.intro.subtitle" />
                            }
                            titleVariant="titleMedium"
                        />
                    </VStack>
                    <InlineAlertBox
                        variant="success"
                        title={<Translation id="moduleDemoAccountQuestionnaire.intro.note" />}
                    />
                </VStack>
                <VStack spacing="sp12">
                    <Button onPress={handleContinue}>
                        <Translation id="moduleDemoAccountQuestionnaire.intro.primaryCta" />
                    </Button>
                    <Button colorScheme="tertiaryElevation0" onPress={handleExit}>
                        <Translation id="moduleDemoAccountQuestionnaire.intro.secondaryCta" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};
