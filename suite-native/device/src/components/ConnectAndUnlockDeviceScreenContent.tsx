import { Dimensions } from 'react-native';

import { Text, VStack } from '@suite-native/atoms';
import { ConnectDeviceAnimation } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const ANIMATION_HEIGHT = Dimensions.get('screen').height * 0.6;

const screenContentStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: utils.spacings.sp40,
}));

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
}));

export const ConnectAndUnlockDeviceScreenContent = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack style={applyStyle(screenContentStyle)}>
            <Text variant="titleMedium" textAlign="center">
                <Translation id="moduleConnectDevice.connectAndUnlockScreen.title" />
            </Text>
            <ConnectDeviceAnimation style={applyStyle(animationStyle)} />
        </VStack>
    );
};
