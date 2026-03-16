import { useNavigation } from '@react-navigation/native';

import { type DemoAccountQuestionnaireLinkKey, events } from '@suite-native/analytics';
import { Button, PictogramTitleHeader, TextDivider, VStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    type DemoAccountQuestionnaireStackParamList,
    type DemoAccountQuestionnaireStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import {
    ESHOP_WHAT_IS_A_HARDWARE_WALLET_URL,
    ESHOP_WHY_TREZOR_IS_SECURE_URL,
    HELP_CENTER_T3W1_INTRODUCTION_URL,
} from '@trezor/urls';

import { DemoAccountQuestionnaireLink } from '../components/DemoAccountQuestionnaireLink';

type Recommendation = {
    key: DemoAccountQuestionnaireLinkKey;
    url: string;
    translationId: TxKeyPath;
    iconName?: IconName;
};

const RECOMMENDATIONS: Recommendation[] = [
    {
        key: 'hardwareWallet',
        iconName: 'trezorPassword',
        translationId: 'moduleDemoAccountQuestionnaire.success.recommendations.hardwareWallet',
        url: ESHOP_WHAT_IS_A_HARDWARE_WALLET_URL,
    },
    {
        key: 'trezorSecurity',
        iconName: 'lock',
        translationId: 'moduleDemoAccountQuestionnaire.success.recommendations.trezorSecurity',
        url: ESHOP_WHY_TREZOR_IS_SECURE_URL,
    },
    {
        key: 'TS7',
        iconName: 'trezorSafe7',
        translationId: 'moduleDemoAccountQuestionnaire.success.recommendations.trezorSafe7',
        url: HELP_CENTER_T3W1_INTRODUCTION_URL,
    },
];

type NavigationProp = StackNavigationProps<
    DemoAccountQuestionnaireStackParamList,
    DemoAccountQuestionnaireStackRoutes.Success
>;

export const DemoAccountQuestionnaireSuccessScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const openLink = useOpenLink();
    const analytics = useAnalytics();
    const handleOpenUrl = (recommendation: Recommendation) => {
        analytics.report(
            {
                type: events.demoAccountQuestionnaireLinksEvent.name,
                payload: {
                    option: recommendation.key,
                },
            },
            { force: true },
        );

        openLink(recommendation.url);
    };

    const handleBackToDashboard = () => {
        analytics.report(
            {
                type: events.demoAccountQuestionnaireLinksEvent.name,
                payload: {
                    option: 'dashboard',
                },
            },
            { force: true },
        );

        const parentNavigator = navigation.getParent();

        if (parentNavigator) {
            parentNavigator.goBack();
        } else {
            navigation.goBack();
        }
    };

    return (
        <Screen header={<ScreenHeader />}>
            <VStack justifyContent="space-between" flex={1} paddingTop="sp8">
                <VStack spacing="sp32">
                    <PictogramTitleHeader
                        variant="success"
                        icon="heart"
                        title={<Translation id="moduleDemoAccountQuestionnaire.success.title" />}
                        subtitle={
                            <Translation id="moduleDemoAccountQuestionnaire.success.subtitle" />
                        }
                        titleVariant="headline-md"
                    />

                    <TextDivider
                        title="moduleDemoAccountQuestionnaire.success.recommendationsHeading"
                        lineColor="borderOnElevation0"
                        textColor="textSubdued"
                    />

                    <VStack spacing="sp12">
                        {RECOMMENDATIONS.map(recommendation => (
                            <DemoAccountQuestionnaireLink
                                key={recommendation.key}
                                iconName={recommendation.iconName}
                                label={<Translation id={recommendation.translationId} />}
                                onPress={() => handleOpenUrl(recommendation)}
                            />
                        ))}
                    </VStack>
                </VStack>
                <Button onPress={handleBackToDashboard} colorScheme="tertiaryElevation0">
                    <Translation id="moduleDemoAccountQuestionnaire.success.backCta" />
                </Button>
            </VStack>
        </Screen>
    );
};
