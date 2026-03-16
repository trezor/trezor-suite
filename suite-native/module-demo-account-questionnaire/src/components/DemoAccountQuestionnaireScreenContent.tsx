import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import {
    type DemoAccountQuestionnaireQuestion,
    type DemoAccountQuestionnaireQuestionOption,
    events,
} from '@suite-native/analytics';
import { Button, HStack, ScreenFooterGradient, Text, VStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    type DemoAccountQuestionnaireStackParamList,
    type DemoAccountQuestionnaireStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { DemoAccountQuestionnaireAnswer } from './DemoAccountQuestionnaireAnswer';

export type DemoAccountQuestionnaireAnswerOption = {
    key: DemoAccountQuestionnaireQuestionOption;
    translationId: TxKeyPath;
    iconName?: IconName;
};

type DemoAccountQuestionnaireScreenContentProps = {
    questionId: DemoAccountQuestionnaireQuestion;
    screenTitleTranslationId: TxKeyPath;
    answerOptions: DemoAccountQuestionnaireAnswerOption[];
    nextRoute: DemoAccountQuestionnaireStackRoutes;
};

export const DemoAccountQuestionnaireScreenContent = ({
    questionId,
    screenTitleTranslationId,
    answerOptions,
    nextRoute,
}: DemoAccountQuestionnaireScreenContentProps) => {
    const analytics = useAnalytics();
    const navigation =
        useNavigation<
            StackNavigationProps<
                DemoAccountQuestionnaireStackParamList,
                DemoAccountQuestionnaireStackRoutes
            >
        >();
    const [selectedOptionId, setSelectedOptionId] =
        useState<DemoAccountQuestionnaireQuestionOption | null>(null);

    const submitOption = (key: DemoAccountQuestionnaireQuestionOption) => {
        analytics.report(
            {
                type: events.demoAccountQuestionnaireQuestionEvent.name,
                payload: {
                    option: key,
                    question: questionId,
                },
            },
            { force: true },
        );

        navigation.navigate(nextRoute);
    };

    const handleContinuePress = () => {
        if (!selectedOptionId) {
            return;
        }

        const option = answerOptions.find(item => item.key === selectedOptionId);
        if (!option) {
            return;
        }

        submitOption(option.key);
    };

    return (
        <Screen
            header={<ScreenHeader />}
            footer={
                !!selectedOptionId && (
                    <Animated.View entering={FadeInDown}>
                        <ScreenFooterGradient />
                        <VStack marginHorizontal="sp16" marginBottom="sp16">
                            <Button onPress={handleContinuePress}>
                                <Translation id="generic.buttons.continue" />
                            </Button>
                        </VStack>
                    </Animated.View>
                )
            }
        >
            <VStack spacing="sp32" paddingTop="sp16">
                <Text variant="headline-md">
                    <Translation id={screenTitleTranslationId} />
                </Text>

                <VStack spacing="sp16">
                    {answerOptions.map(option => (
                        <DemoAccountQuestionnaireAnswer
                            key={option.key}
                            value={option.key}
                            label={<Translation id={option.translationId} />}
                            iconName={option.iconName}
                            isSelected={selectedOptionId === option.key}
                            onSelect={() => setSelectedOptionId(option.key)}
                        />
                    ))}
                    <HStack justifyContent="center">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            onPress={() => submitOption('none')}
                        >
                            <Translation id="moduleDemoAccountQuestionnaire.noneOption" />
                        </Button>
                    </HStack>
                </VStack>
            </VStack>
        </Screen>
    );
};
