import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { Box, Button, IconListTextItem, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    type DeviceCheckBackupStackParamList,
    type DeviceCheckBackupStackRoutes,
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    Screen,
    ScreenHeader,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { SUITE_WEB_DEVICE_SETTINGS_URL } from '@trezor/urls';

type RouteProps = RouteProp<
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes.UnsupportedModel
>;

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceCheckBackupStackRoutes.UnsupportedModel,
    DeviceCheckBackupStackParamList
>;

export const DeviceCheckBackupUnsupportedModelScreen = () => {
    const { params } = useRoute<RouteProps>();

    const navigation = useNavigation<NavigationProps>();
    const openLink = useOpenLink();

    const redirectToWeb = () => {
        openLink(SUITE_WEB_DEVICE_SETTINGS_URL);
    };

    const redirectToDeviceSettings = () => {
        navigation.popTo(DeviceSettingsStackRoutes.DeviceSettings);
    };

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <Box marginTop="sp16">
                <TitleHeader
                    titleVariant="headline-md"
                    title={
                        <Translation id="moduleCheckBackup.checkBackupUnsupportedModelScreen.title" />
                    }
                    subtitle={
                        <Translation
                            id="moduleCheckBackup.checkBackupUnsupportedModelScreen.subtitle"
                            values={{
                                deviceModel: params.deviceModel,
                            }}
                        />
                    }
                    titleSpacing="sp12"
                />
            </Box>
            <VStack justifyContent="space-between" flex={1}>
                <VStack spacing="sp16" marginTop="sp32">
                    <IconListTextItem textVariant="body-md-strong" iconSize="large" icon="browsers">
                        <Translation id="moduleCheckBackup.checkBackupUnsupportedModelScreen.step1" />
                    </IconListTextItem>
                    <IconListTextItem
                        textVariant="body-md-strong"
                        iconSize="large"
                        icon="trezorBackup"
                    >
                        <Translation id="moduleCheckBackup.checkBackupUnsupportedModelScreen.step2" />
                    </IconListTextItem>
                    <IconListTextItem
                        textVariant="body-md-strong"
                        iconSize="large"
                        variant="primary"
                        icon="checkCircle"
                    >
                        <Translation id="moduleCheckBackup.checkBackupUnsupportedModelScreen.step3" />
                    </IconListTextItem>
                </VStack>
                <VStack spacing="sp12">
                    <Button iconLeft="arrowSquareOut" onPress={redirectToWeb}>
                        <Translation id="moduleCheckBackup.checkBackupUnsupportedModelScreen.redirectButton" />
                    </Button>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onPress={redirectToDeviceSettings}
                    >
                        <Translation id="moduleCheckBackup.checkBackupUnsupportedModelScreen.laterButton" />
                    </Button>
                </VStack>
            </VStack>
        </Screen>
    );
};
