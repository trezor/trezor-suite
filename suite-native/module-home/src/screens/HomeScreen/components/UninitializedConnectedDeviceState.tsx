import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceModel } from '@suite-common/device';
import { Box, Button, Card, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorAnimation } from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const cardStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    paddingTop: utils.spacings.sp32,
    paddingBottom: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
}));

const contentStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

const buttonStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const UninitializedConnectedDeviceState = () => {
    const { applyStyle } = useNativeStyles();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();

    const deviceModel = useSelector(selectDeviceModel);

    const handleAddAccount = () => {
        navigation.navigate(RootStackRoutes.DeviceOnboardingStack, {
            screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
            params: {
                deviceModel: deviceModel ?? DeviceModelInternal.UNKNOWN,
            },
        });
    };

    return (
        <Card style={applyStyle(cardStyle)}>
            <VStack spacing="sp24" style={applyStyle(contentStyle)}>
                {/* Prevents translation clipping on CenteredTitleHeader in some languages. */}
                <Box alignItems="center">
                    <ConfirmOnTrezorAnimation />
                </Box>
                <CenteredTitleHeader
                    title={<Translation id="moduleHome.emptyState.uninitializedDevice.title" />}
                    subtitle={
                        <Translation id="moduleHome.emptyState.uninitializedDevice.subtitle" />
                    }
                    testID="@homescreen/uninitializedConnectedDeviceText"
                    alignSelf="stretch"
                />
                <Button size="large" onPress={handleAddAccount} style={applyStyle(buttonStyle)}>
                    <Translation id="moduleHome.emptyState.uninitializedDevice.button" />
                </Button>
            </VStack>
        </Card>
    );
};
