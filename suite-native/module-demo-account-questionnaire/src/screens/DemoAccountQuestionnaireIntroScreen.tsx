import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { Button, InlineAlertBox, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DemoAccountQuestionnaireStackParamList,
    DemoAccountQuestionnaireStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

export const DemoAccountQuestionnaireIntroScreen = () => {
    const analytics = useAnalytics();
    const navigation =
        useNavigation<
            StackNavigationProps<
                DemoAccountQuestionnaireStackParamList,
                DemoAccountQuestionnaireStackRoutes.Intro
            >
        >();

    const handleContinue = () => {
        analytics.report({ type: events.demoAccountQuestionnaireStartEvent.name }, { force: true });
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
                            titleVariant="headline-md"
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
                    <Button intent="neutral" priority="secondary" onPress={handleExit}>
                        <Translation id="moduleDemoAccountQuestionnaire.intro.secondaryCta" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};
