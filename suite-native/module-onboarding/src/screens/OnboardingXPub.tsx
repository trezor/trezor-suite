import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Camera as RNCamera } from 'react-native-vision-camera';

import { Screen, StackProps } from '@suite-native/navigation';
import { Box, Button, Input, InputWrapper, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';

import { Camera } from '../components/Camera';
import { OnboardingStackParamList, OnboardingStackRoutes } from '../navigation/routes';

const networkStyles = prepareNativeStyle(_ => ({
    flexDirection: 'row',
}));

const cameraStyles = prepareNativeStyle(_ => ({
    marginTop: 20,
    marginBottom: 45,
}));

const networkButtonStyles = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const OnboardingXPub = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.OnboardingXPub>) => {
    const [selectedNetwork, setSelectedNetwork] = useState<string>('btc');
    const [inputText, setInputText] = useState<string>('');
    const camera = useRef<RNCamera>(null);
    const { applyStyle } = useNativeStyles();

    const handleSwitchNetwork = (network: string) => {
        setSelectedNetwork(network);
    };

    const handleScanResult = (value?: string) => {
        // TODO validate xpub
        if (value) {
            navigation.navigate(OnboardingStackRoutes.OnboardingFetching, {
                // TODO replace with real values
                xpubAddress:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                network: 'btc',
            });
        }
    };

    return (
        <Screen backgroundColor="black" hasStatusBar={false}>
            <View style={applyStyle(networkStyles)}>
                <Button
                    leftIcon={<CryptoIcon name="btc" size="extraSmall" />}
                    size="small"
                    colorScheme="white"
                    style={applyStyle(networkButtonStyles)}
                    onPress={() => handleSwitchNetwork('btc')}
                >
                    Bitcoin
                </Button>
                <Button
                    leftIcon={<CryptoIcon name="test" size="extraSmall" />}
                    size="small"
                    colorScheme="gray"
                    style={applyStyle(networkButtonStyles)}
                    onPress={() => handleSwitchNetwork('testnet')}
                >
                    Testnet
                </Button>
            </View>
            <View style={applyStyle(cameraStyles)}>
                <Camera ref={camera} onResult={handleScanResult} />
            </View>
            <Box alignItems="center" marginBottom="medium">
                <Text variant="body" color="gray600">
                    or
                </Text>
            </Box>
            <InputWrapper>
                <Input value={inputText} onChange={setInputText} label="Enter x-pub..." />
            </InputWrapper>
        </Screen>
    );
};
