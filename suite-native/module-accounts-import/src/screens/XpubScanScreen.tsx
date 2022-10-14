import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Button, Chip, Text, VStack } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { CryptoIcon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { yup } from '@trezor/validation';

import { Camera, CAMERA_HEIGHT } from '../components/Camera';

const coinStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    borderRadius: utils.borders.radii.large,
    backgroundColor: utils.transparentize(0.8, utils.colors.gray0),
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

const chipStyle = prepareNativeStyle<{ isSelected: boolean }>((utils, { isSelected }) => ({
    ...utils.typography.label,
    flex: 1,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: utils.borders.radii.large,
    extend: {
        condition: isSelected,
        style: {
            backgroundColor: utils.colors.gray0,
        },
    },
}));

const devXpubButtonStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.large,
    borderRadius: utils.borders.radii.round,
}));

const submitButtonStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.forest,
}));

const DEFAULT_CURRENCY_SYMBOL = 'btc';
// Slip 0014 - https://github.com/satoshilabs/slips/blob/master/slip-0014.md#bitcoin-segwit--p2wpkh--bip84
const BTC_HARD_CODED_XPUB =
    'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy';

const xpubFormValidationSchema = yup.object({
    xpubAddress: yup.string().required(),
});
type XpubFormValues = yup.InferType<typeof xpubFormValidationSchema>;

export const XpubScanScreen = ({
    navigation,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScan>) => {
    const [selectedCurrencySymbol, setSelectedCurrencySymbol] =
        useState<NetworkSymbol>(DEFAULT_CURRENCY_SYMBOL);
    const [cameraRequested, setCameraRequested] = useState<boolean>(false);
    const { applyStyle } = useNativeStyles();

    const form = useForm<XpubFormValues>({
        validation: xpubFormValidationSchema,
    });
    const { handleSubmit, setValue, watch, reset } = form;
    const watchXpubAddress = watch('xpubAddress');

    const resetToDefaultValues = useCallback(() => {
        setCameraRequested(false);
    }, []);

    useFocusEffect(resetToDefaultValues);

    const handleSelectCurrency = (currencySymbol: NetworkSymbol) => {
        setSelectedCurrencySymbol(currencySymbol);
    };

    const handleRequestCamera = () => {
        reset({
            xpubAddress: '',
        });
        setCameraRequested(true);
    };

    const goToAccountImportScreen = ({ xpubAddress }: XpubFormValues) => {
        navigation.navigate(AccountsImportStackRoutes.AccountImport, {
            xpubAddress,
            currencySymbol: selectedCurrencySymbol,
        });
    };

    const onXpubFormSubmit = handleSubmit(goToAccountImportScreen);

    const handleXpubResult = useCallback(
        (xpubAddress?: string) => {
            if (xpubAddress && xpubAddress !== watchXpubAddress) {
                setValue('xpubAddress', xpubAddress);
                onXpubFormSubmit();
            }
        },
        [watchXpubAddress, onXpubFormSubmit, setValue],
    );

    return (
        <Screen backgroundColor="gray1000">
            <Box>
                <View style={applyStyle(coinStyle)}>
                    <Chip
                        icon={<CryptoIcon name="btc" />}
                        title="Bitcoin"
                        titleColor="gray200"
                        onSelect={() => handleSelectCurrency('btc')}
                        style={applyStyle(chipStyle, {
                            isSelected: selectedCurrencySymbol === 'btc',
                        })}
                        isSelected={selectedCurrencySymbol === 'btc'}
                    />
                    <Chip
                        icon={<CryptoIcon name="test" />}
                        title="Testnet"
                        titleColor="gray200"
                        onSelect={() => handleSelectCurrency('test')}
                        style={applyStyle(chipStyle, {
                            isSelected: selectedCurrencySymbol === 'test',
                        })}
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

                <Form form={form}>
                    <VStack spacing="medium">
                        <TextInputField name="xpubAddress" label="Enter x-pub..." />
                        <Button style={applyStyle(submitButtonStyle)} onPress={onXpubFormSubmit}>
                            Submit
                        </Button>
                    </VStack>
                </Form>

                {isDevelopOrDebugEnv() && (
                    <Button
                        style={applyStyle(devXpubButtonStyle)}
                        onPress={() =>
                            goToAccountImportScreen({ xpubAddress: BTC_HARD_CODED_XPUB })
                        }
                        colorScheme="gray"
                    >
                        Use dev xPub
                    </Button>
                )}
            </Box>
        </Screen>
    );
};
