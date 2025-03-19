import { useNavigation } from '@react-navigation/native';

import { Button, Card, CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { InitializeTrezorSvg } from '../../../assets/InitializeTrezorSvg';

const cardStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: utils.spacings.sp32,
    paddingBottom: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
}));

const contentStyle = prepareNativeStyle(_ => ({
    width: '100%',
    alignItems: 'center',
}));

const buttonStyle = prepareNativeStyle(_ => ({
    width: '100%',
}));

export const UninitializedConnectedDeviceState = () => {
    const { applyStyle } = useNativeStyles();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();

    const handleAddAccount = () => {
        navigation.navigate(RootStackRoutes.DeviceOnboardingStack, {
            screen: DeviceOnboardingStackRoutes.UninitializedDeviceLanding,
        });
    };

    return (
        <Card style={applyStyle(cardStyle)}>
            <VStack spacing="sp24" style={applyStyle(contentStyle)}>
                <InitializeTrezorSvg />
                <CenteredTitleHeader
                    title={<Translation id="moduleHome.emptyState.uninitializedDevice.title" />}
                    subtitle={
                        <Translation id="moduleHome.emptyState.uninitializedDevice.subtitle" />
                    }
                />
                <Button size="large" onPress={handleAddAccount} style={applyStyle(buttonStyle)}>
                    <Translation id="moduleHome.emptyState.uninitializedDevice.button" />
                </Button>
            </VStack>
        </Card>
    );
};
