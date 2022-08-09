import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { Screen, StackProps } from '@suite-native/navigation';
import { Box, Chip, Input, InputWrapper, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { Camera, CAMERA_HEIGHT } from '../components/Camera';
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
    height: CAMERA_HEIGHT,
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
const DEFAULT_CURRENCY_SYMBOL = 'btc';

export const OnboardingXpubScan = ({
    navigation,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.OnboardingXpubScan>) => {
    const [selectedCurrencySymbol, setSelectedCurrencySymbol] =
        useState<NetworkSymbol>(DEFAULT_CURRENCY_SYMBOL);
    const [inputText, setInputText] = useState<string>(DEFAULT_XPUB_INPUT_TEXT);
    const [cameraRequested, setCameraRequested] = useState<boolean>(false);
    const { applyStyle } = useNativeStyles();

    const resetToDefaultValues = useCallback(() => {
        setSelectedCurrencySymbol(DEFAULT_CURRENCY_SYMBOL);
        setInputText(DEFAULT_XPUB_INPUT_TEXT);
        setCameraRequested(false);
    }, []);

    useFocusEffect(resetToDefaultValues);

    const handleSelectCurrency = (currencySymbol: NetworkSymbol) => {
        setSelectedCurrencySymbol(currencySymbol);
    };

    const handleRequestCamera = () => {
        setCameraRequested(true);
    };

    const handleXpubResult = (value?: string) => {
        if (value) {
            navigation.navigate(OnboardingStackRoutes.OnboardingAssets, {
                xpubAddress: value,
                currencySymbol: selectedCurrencySymbol,
            });
        }
    };

    return (
        <Screen backgroundColor="black" hasStatusBar={false}>
            <View style={applyStyle(xpubContainerStyle)}>
                <View style={applyStyle(coinStyle)}>
                    <Chip
                        icon={<CryptoIcon name="btc" />}
                        title="Bitcoin"
                        onSelect={() => handleSelectCurrency('btc')}
                        style={applyStyle(chipStyle)}
                        isSelected={selectedCurrencySymbol === 'btc'}
                    />
                    <Chip
                        icon={<CryptoIcon name="test" />}
                        title="Testnet"
                        onSelect={() => handleSelectCurrency('test')}
                        style={applyStyle(chipStyle)}
                        isSelected={selectedCurrencySymbol === 'test'}
                    />
                </View>
                <View style={applyStyle(cameraStyle)}>
                    {cameraRequested ? (
                        <Camera onResult={handleXpubResult} />
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
                        onSubmitEditing={handleXpubResult}
                        label="Enter x-pub..."
                    />
                </InputWrapper>
            </View>
        </Screen>
    );
};
