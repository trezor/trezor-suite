import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { Screen, StackProps } from '@suite-native/navigation';
import { Box, Button, Chip, Input, InputWrapper, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon } from '@trezor/icons';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { Camera, CAMERA_HEIGHT } from '../components/Camera';
import { AssetsStackParamList, AssetsStackRoutes } from '../navigation/routes';

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

const devXpubButtonStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.small,
    borderRadius: utils.borders.radii.round,
}));

const DEFAULT_XPUB_INPUT_TEXT = '';
const DEFAULT_CURRENCY_SYMBOL = 'btc';

export const XpubScan = ({
    navigation,
}: StackProps<AssetsStackParamList, AssetsStackRoutes.XpubScan>) => {
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
            navigation.navigate(AssetsStackRoutes.AssetsImport, {
                xpubAddress: value,
                currencySymbol: selectedCurrencySymbol,
            });
        }
    };

    return (
        <Screen backgroundColor="gray1000">
            <Box>
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
                            <Text variant="body" color="gray0">
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
                    {__DEV__ && (
                        <Button
                            style={applyStyle(devXpubButtonStyle)}
                            onPress={() =>
                                handleXpubResult(
                                    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
                                )
                            }
                            colorScheme="gray"
                        >
                            DEV: Request dev xPub
                        </Button>
                    )}
                </InputWrapper>
            </Box>
        </Screen>
    );
};
