import { ImageBackground } from 'react-native';

import { Screen } from '@suite-native/navigation';
import { Text, Image, VStack } from '@suite-native/atoms';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const ConnectAndUnlockDeviceScreen = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen customHorizontalPadding={0} customVerticalPadding={0} hasBottomInset={false}>
            <ImageBackground
                // eslint-disable-next-line global-require
                source={require('../assets/bg.png')}
                resizeMode="stretch"
                style={applyStyle(contentStyle)}
            >
                <VStack flex={1} justifyContent="flex-end">
                    <Text variant="titleMedium" textAlign="center">
                        Connect & unlock your Trezor
                    </Text>
                    <Image
                        // eslint-disable-next-line global-require
                        source={require('../assets/connectedTrezor.png')}
                        accessibilityLabel="Connected Trezor"
                    />
                </VStack>
            </ImageBackground>
        </Screen>
    );
};
