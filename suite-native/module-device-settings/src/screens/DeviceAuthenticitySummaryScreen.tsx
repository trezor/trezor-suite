import { SUITE_LITE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import {
    Button,
    ButtonColorScheme,
    IconListItem,
    PictogramTitleHeader,
    PictogramVariant,
    VStack,
} from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    Screen,
    ScreenSubHeader,
    StackToTabCompositeScreenProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type CheckResult = 'successful' | 'compromised';
type SummaryConfig = {
    pictogramVariant: PictogramVariant;
    pictogramIcon: IconName;
    title: TxKeyPath;
    subtitle: TxKeyPath;
    closeColorScheme: ButtonColorScheme;
};

const summaryConfigMap = {
    successful: {
        pictogramVariant: 'green',
        pictogramIcon: 'check',
        title: 'moduleDeviceSettings.authenticity.summary.successful.title',
        subtitle: 'moduleDeviceSettings.authenticity.summary.successful.subtitle',
        closeColorScheme: 'primary',
    },
    compromised: {
        pictogramVariant: 'red',
        pictogramIcon: 'warningCircle',
        title: 'moduleDeviceSettings.authenticity.summary.compromised.title',
        subtitle: 'moduleDeviceSettings.authenticity.summary.compromised.subtitle',
        closeColorScheme: 'redElevation0',
    },
} as const satisfies Record<CheckResult, SummaryConfig>;

export const DeviceAuthenticitySummaryScreen = ({
    route,
}: StackToTabCompositeScreenProps<
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes.AuthenticitySummary,
    DeviceSettingsStackParamList
>) => {
    const { checkResult } = route.params;

    const navigateToInitialScreen = useNavigateToInitialScreen();
    const openLink = useOpenLink();

    const { pictogramVariant, pictogramIcon, title, subtitle, closeColorScheme } =
        summaryConfigMap[checkResult];

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    customHorizontalPadding="sp16"
                    closeActionType="close"
                    closeAction={navigateToInitialScreen}
                />
            }
            customHorizontalPadding="sp16"
        >
            <VStack flex={1} spacing="sp40" justifyContent="center">
                <PictogramTitleHeader
                    variant={pictogramVariant}
                    icon={pictogramIcon}
                    title={<Translation id={title} />}
                    titleVariant="titleMedium"
                    subtitle={<Translation id={subtitle} />}
                />
                {checkResult === 'compromised' && (
                    <VStack spacing="sp24" justifyContent="center">
                        <IconListItem icon="plugs" variant="red">
                            <Translation id="moduleDeviceSettings.authenticity.summary.compromised.item1" />
                        </IconListItem>
                        <IconListItem icon="handPalm" variant="red">
                            <Translation id="moduleDeviceSettings.authenticity.summary.compromised.item2" />
                        </IconListItem>
                        <IconListItem icon="chatCircle" variant="red">
                            <Translation id="moduleDeviceSettings.authenticity.summary.compromised.item3" />
                        </IconListItem>
                    </VStack>
                )}
            </VStack>
            <VStack spacing="sp12">
                {checkResult === 'compromised' && (
                    <Button colorScheme="redBold" onPress={() => openLink(SUITE_LITE_SUPPORT_URL)}>
                        <Translation id="moduleDeviceSettings.authenticity.summary.compromised.contactSupportButton" />
                    </Button>
                )}
                <Button
                    colorScheme={closeColorScheme}
                    onPress={navigateToInitialScreen}
                    testID="@device-authenticity/close-button"
                >
                    <Translation id="generic.buttons.close" />
                </Button>
            </VStack>
        </Screen>
    );
};
