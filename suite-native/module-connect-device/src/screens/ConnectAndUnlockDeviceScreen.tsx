import { Dimensions } from 'react-native';

import { Text, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { ConnectDeviceAnimation } from '@suite-native/device';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Screen } from '@suite-native/navigation';

import { ConnectDeviceScreenHeader } from '../components/ConnectDeviceScreenHeader';

const ANIMATION_HEIGHT = Dimensions.get('screen').height * 0.6;

const screenContentStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
}));

const animationStyle = prepareNativeStyle(() => ({
    height: ANIMATION_HEIGHT,
}));

export const ConnectAndUnlockDeviceScreen = () => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    return (
        <Screen
            screenHeader={<ConnectDeviceScreenHeader />}
            customHorizontalPadding={0}
            customVerticalPadding={0}
            hasBottomInset={false}
            isScrollable={false}
        >
            <VStack style={applyStyle(screenContentStyle)}>
                <Text variant="titleMedium" textAlign="center">
                    {translate('moduleConnectDevice.connectAndUnlockScreen.title')}
                </Text>
                <ConnectDeviceAnimation style={applyStyle(animationStyle)} />
            </VStack>
        </Screen>
    );
};
