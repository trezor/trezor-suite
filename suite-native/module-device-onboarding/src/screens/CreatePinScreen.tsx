import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { Box, Image, TitleHeader } from '@suite-native/atoms';
import { usePinAction } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { deviceImageMap } from '@suite-native/module-authorize-device';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList,
    Screen,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const SCREEN_HEIGHT = getScreenHeight();

const imageStyle = prepareNativeStyle(_ => ({
    maxHeight: SCREEN_HEIGHT * 0.6,
    width: 262.6,
    height: 584,
    alignItems: 'center',
    contentFit: 'contain',
}));

const containerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: utils.spacings.sp32,
}));

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.CreatePin,
    RootStackParamList
>;
export const CreatePinScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const deviceModel = useSelector(selectDeviceModel);
    const { applyStyle } = useNativeStyles();
    usePinAction({
        type: 'enable',
        onSuccess: () => {
            // TODO: temporary, not implemented yet
            navigation.goBack();
        },
    });

    const onCancel = () => {
        TrezorConnect.cancel();
        navigation.goBack();
    };

    return (
        <Screen
            header={<ScreenHeader closeAction={onCancel} />}
            hasBottomInset={false}
            isScrollable={false}
        >
            <Box style={applyStyle(containerStyle)}>
                <TitleHeader
                    titleVariant="titleMedium"
                    title={<Translation id="moduleDeviceOnboarding.createPinScreen.title" />}
                    subtitle={<Translation id="moduleDeviceOnboarding.createPinScreen.subtitle" />}
                    textAlign="center"
                />
                <Image
                    source={deviceImageMap[deviceModel || DeviceModelInternal.UNKNOWN]}
                    style={applyStyle(imageStyle)}
                />
            </Box>
        </Screen>
    );
};
