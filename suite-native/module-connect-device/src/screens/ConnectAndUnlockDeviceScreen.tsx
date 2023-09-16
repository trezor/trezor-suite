import { Screen } from '@suite-native/navigation';
import { Text, Image, VStack, Box } from '@suite-native/atoms';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

const backgroundImageStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'stretch',
}));

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const titleStyle = prepareNativeStyle(_ => ({
    textAlign: 'center',
}));

export const ConnectAndUnlockDeviceScreen = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen customHorizontalPadding={0} customVerticalPadding={0}>
            <Box style={applyStyle(contentStyle)} flex={1}>
                <Image
                    // eslint-disable-next-line global-require
                    source={require('../assets/bg.png')}
                    style={applyStyle(backgroundImageStyle)}
                />
                <VStack flex={1} justifyContent="space-between">
                    <Text variant="titleMedium" style={applyStyle(titleStyle)}>
                        Connect & unlock your Trezor
                    </Text>
                    {/* eslint-disable-next-line global-require */}
                    <Image source={require('../assets/connectedTrezor.png')} />
                </VStack>
            </Box>
        </Screen>
    );
};
