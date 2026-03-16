import { Platform, View } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { events } from '@suite-native/analytics';
import { Button, Card, CenteredTitleHeader, Text, VStack } from '@suite-native/atoms';
import { useConnectDeviceHandler } from '@suite-native/device';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import {
    AccountsImportStackRoutes,
    DemoAccountQuestionnaireStackRoutes,
    type HomeStackParamList,
    type HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ConnectTrezorSvg } from '../../../assets/ConnectTrezorSvg';

const platformSpecificTitle: TxKeyPath = Platform.select({
    ios: 'moduleHome.emptyState.connectTrezor.title.ios',
    default: 'moduleHome.emptyState.connectTrezor.title.android',
});

const cardStyle = prepareNativeStyle<{ flex: 1 | 2 }>((utils, { flex }) => ({
    flex,
    justifyContent: 'center',
    paddingTop: utils.spacings.sp24,
    paddingBottom: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
}));

const buttonWrapperStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type NavigationProps = StackToStackCompositeNavigationProps<
    HomeStackParamList,
    HomeStackRoutes.Home,
    RootStackParamList
>;

type SecondaryCardConfig = {
    titleTranslationId: TxKeyPath;
    descriptionTranslationId: TxKeyPath;
    buttonTranslationId: TxKeyPath;
    onPress: () => void;
    testID: string;
};

export const EmptyPortfolioCrossroads = () => {
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProps>();
    const { applyStyle } = useNativeStyles();

    const { onConnectDevicePress } = useConnectDeviceHandler();
    const isQuestionnaireEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.demoAccountQuestionnaire, true),
    );

    const handleConnectDevice = () => {
        onConnectDevicePress();
        analytics.report({
            type: events.emptyDashboardActionEvent.name,
            payload: { action: 'connectDevice' },
        });
    };

    const handleSyncMyCoins = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
        analytics.report({
            type: events.emptyDashboardActionEvent.name,
            payload: { action: 'syncCoins' },
        });
    };

    const handleOpenQuestionnaire = () => {
        navigation.navigate(RootStackRoutes.DemoAccountQuestionnaireStack, {
            screen: DemoAccountQuestionnaireStackRoutes.Intro,
        });
        analytics.report({ type: events.demoAccountQuestionnaireDashboardEvent.name });
    };

    const secondaryCardConfig: SecondaryCardConfig = isQuestionnaireEnabled
        ? {
              titleTranslationId: 'moduleHome.emptyState.demoAccountQuestionnaire.title',
              descriptionTranslationId:
                  'moduleHome.emptyState.demoAccountQuestionnaire.description',
              buttonTranslationId: 'moduleHome.emptyState.demoAccountQuestionnaire.button',
              onPress: handleOpenQuestionnaire,
              testID: '@home/portfolio/open-demo-questionnaire-button',
          }
        : {
              titleTranslationId: 'moduleHome.emptyState.syncCoins.title',
              descriptionTranslationId: 'moduleHome.emptyState.syncCoins.description',
              buttonTranslationId: 'moduleHome.emptyState.syncCoins.syncButton',
              onPress: handleSyncMyCoins,
              testID: '@home/portfolio/sync-coins-button',
          };

    return (
        <VStack spacing="sp16" flex={1}>
            <Card style={applyStyle(cardStyle, { flex: 2 })}>
                <VStack spacing="sp24" justifyContent="center" alignItems="center">
                    <ConnectTrezorSvg />
                    <CenteredTitleHeader
                        title={<Translation id={platformSpecificTitle} />}
                        subtitle={
                            <Translation id="moduleHome.emptyState.connectTrezor.description" />
                        }
                    />
                    <View style={applyStyle(buttonWrapperStyle)}>
                        <Button onPress={handleConnectDevice}>
                            <Translation id="moduleHome.emptyState.connectTrezor.connectButton" />
                        </Button>
                    </View>
                </VStack>
            </Card>
            <Card style={applyStyle(cardStyle, { flex: 1 })}>
                <VStack spacing="sp24" justifyContent="center" alignItems="center">
                    <VStack alignItems="center">
                        <Text variant="headline-sm" textAlign="center">
                            <Translation id={secondaryCardConfig.titleTranslationId} />
                        </Text>
                        <Text color="textSubdued" textAlign="center">
                            <Translation id={secondaryCardConfig.descriptionTranslationId} />
                        </Text>
                    </VStack>
                    <View style={applyStyle(buttonWrapperStyle)}>
                        <Button
                            onPress={secondaryCardConfig.onPress}
                            intent="neutral"
                            priority="secondary"
                            testID={secondaryCardConfig.testID}
                        >
                            <Translation id={secondaryCardConfig.buttonTranslationId} />
                        </Button>
                    </View>
                </VStack>
            </Card>
        </VStack>
    );
};
