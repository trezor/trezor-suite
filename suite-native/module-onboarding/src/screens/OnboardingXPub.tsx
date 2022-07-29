import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { Screen, StackProps } from '@suite-native/navigation';
import { Box, Chip, Input, InputWrapper, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';

import { Camera } from '../components/Camera';
import { OnboardingStackParamList, OnboardingStackRoutes } from '../navigation/routes';

const xpubContainerStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.medium,
}));

const coinStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
}));

const cameraStyle = prepareNativeStyle(_ => ({
    marginTop: 20,
    marginBottom: 45,
}));

const cameraPlaceholderStyle = prepareNativeStyle(utils => ({
    height: 329,
    borderRadius: utils.borders.radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: utils.colors.gray800,
}));

const chipStyle = prepareNativeStyle(utils => ({
    flex: 1,
    borderRadius: utils.borders.radii.small,
}));

const DEFAULT_XPUB_INPUT_TEXT = '';
const DEFAULT_SELECTED_COIN = 'btc';
const DEFAULT_XPUB_RESULT = null;

export const OnboardingXPub = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.OnboardingXPub>) => {
    const [xpubResult, setXpubResult] = useState<string | null>(DEFAULT_XPUB_RESULT);
    const [selectedCoin, setSelectedCoin] = useState<string>(DEFAULT_SELECTED_COIN);
    const [inputText, setInputText] = useState<string>(DEFAULT_XPUB_INPUT_TEXT);
    const [cameraRequested, setCameraRequested] = useState<boolean>(false);
    const { applyStyle } = useNativeStyles();

    useFocusEffect(
        useCallback(() => {
            const setDefaultValues = () => {
                setXpubResult(DEFAULT_XPUB_RESULT);
                setSelectedCoin(DEFAULT_SELECTED_COIN);
                setInputText(DEFAULT_XPUB_INPUT_TEXT);
                setCameraRequested(false);
            };

            setDefaultValues();
        }, []),
    );

    useEffect(() => {
        if (xpubResult) {
            navigation.navigate(OnboardingStackRoutes.OnboardingAssets, {
                // TODO fill with real value
                xpubAddress:
                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                coin: 'btc',
            });
        }
    }, [xpubResult, navigation]);

    const handleSelectCoin = (coin: string) => {
        setSelectedCoin(coin);
    };

    const handleRequestCamera = () => {
        setCameraRequested(true);
    };

    const handleScanResult = (value?: string) => {
        // TODO validate xpub
        if (value) {
            setXpubResult(value);
        }
    };

    return (
        <Screen backgroundColor="black" hasStatusBar={false}>
            <View style={applyStyle(xpubContainerStyle)}>
                <View style={applyStyle(coinStyle)}>
                    <Chip
                        icon={<CryptoIcon name="btc" />}
                        title="Bitcoin"
                        onSelect={() => handleSelectCoin('btc')}
                        style={applyStyle(chipStyle)}
                        isSelected={selectedCoin === 'btc'}
                        colorScheme="darkGray"
                    />
                    <Chip
                        icon={<CryptoIcon name="test" />}
                        title="Testnet"
                        onSelect={() => handleSelectCoin('test')}
                        style={applyStyle(chipStyle)}
                        isSelected={selectedCoin === 'test'}
                        colorScheme="darkGray"
                    />
                </View>
                <View style={applyStyle(cameraStyle)}>
                    {cameraRequested ? (
                        <Camera onResult={handleScanResult} />
                    ) : (
                        <Pressable
                            onPress={handleRequestCamera}
                            style={applyStyle(cameraPlaceholderStyle)}
                        >
                            <Text variant="body" color="white">
                                Scan QR
                            </Text>
                        </Pressable>
                    )}
                </View>
                <Box alignItems="center" marginBottom="medium">
                    <Text variant="body" color="gray600">
                        or
                    </Text>
                </Box>
                <InputWrapper>
                    <Input
                        value={inputText}
                        onChange={setInputText}
                        label="Enter x-pub..."
                        colorScheme="darkGray"
                    />
                </InputWrapper>
            </View>
        </Screen>
    );
};
