import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Button, TextDivider, VStack } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { yup } from '@trezor/validation';

import { XpubScanHeader } from '../components/XpubScanHeader';
import { XpubImportSection } from '../components/XpubImportSection';
import { AccountImportHeader } from '../components/AccountImportHeader';

// Note: Btc and testnet are required right now. Everything else is always optional and can be undefined.
const devXpubs: Partial<Record<NetworkSymbol, string>> & Record<'btc' | 'test', string> = {
    btc: 'zpub6rjNNddoAVvuYaD6WPdxiqFEToQHgrERjWMg7kM9gGGk6rhPMWNEmL5X745FGqBq8Wp136LfA3A7UjRGEYdJrf8dUfshzNrb5rvaryNfVJf',
    test: 'vpub5ZjRPuuMiEQnbwEDi9jtH1FaJMajZW78uZ1t3RJXKhxyMoTnPraKwGxiDo9SguDYvSieqjoLJxW5n2t9156RR1oeqRnURuftNZTzejBc4pa',
};

const cameraStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 45,
}));

const devXpubButtonStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.large,
    borderRadius: utils.borders.radii.round,
}));

const DEFAULT_CURRENCY_SYMBOL = 'doge';

const xpubFormValidationSchema = yup.object({
    xpubAddress: yup.string().required(),
});
type XpubFormValues = yup.InferType<typeof xpubFormValidationSchema>;

export const XpubScanScreen = ({
    navigation,
    route,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScan>) => {
    const [selectedCurrencySymbol, setSelectedCurrencySymbol] =
        useState<NetworkSymbol>(DEFAULT_CURRENCY_SYMBOL);
    const [isXpubInputFocused, setIsXpubInputFocused] = useState(false);
    const [_, setIsCameraRequested] = useState<boolean>(false);
    const { applyStyle } = useNativeStyles();

    const form = useForm<XpubFormValues>({
        validation: xpubFormValidationSchema,
    });
    const { handleSubmit, setValue, watch, reset } = form;
    const watchXpubAddress = watch('xpubAddress');

    const resetToDefaultValues = useCallback(() => {
        setIsCameraRequested(false);
        reset();
    }, [reset]);

    useFocusEffect(resetToDefaultValues);

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

    useEffect(() => {
        if (route?.params?.qrCode) {
            handleXpubResult(route?.params?.qrCode);
        }
    }, [handleXpubResult, route.params]);

    const handleSelectCurrency = (currencySymbol: NetworkSymbol) => {
        setSelectedCurrencySymbol(currencySymbol);
    };

    const handleRequestCamera = () => {
        reset({
            xpubAddress: '',
        });
        navigation.navigate(AccountsImportStackRoutes.XpubScanModal);
    };

    return (
        <Screen header={<AccountImportHeader activeStep={1} />}>
            <Box>
                <XpubScanHeader
                    onSelectCurrency={handleSelectCurrency}
                    selectedCurrencySymbol={selectedCurrencySymbol}
                />
                <View style={applyStyle(cameraStyle)}>
                    <XpubImportSection onRequestCamera={handleRequestCamera} />
                </View>
                <TextDivider title="OR" />
                <Form form={form}>
                    <VStack spacing="medium">
                        <TextInputField
                            onFocus={() => setIsXpubInputFocused(true)}
                            onBlur={() => {
                                if (watchXpubAddress) return;
                                setIsXpubInputFocused(false);
                            }}
                            name="xpubAddress"
                            label="Enter x-pub..."
                        />
                        {isXpubInputFocused && (
                            <Button
                                onPress={onXpubFormSubmit}
                                size="large"
                                isDisabled={!watchXpubAddress?.length}
                            >
                                Submit
                            </Button>
                        )}
                    </VStack>
                </Form>
                {isDevelopOrDebugEnv() && (
                    <Button
                        style={applyStyle(devXpubButtonStyle)}
                        onPress={() =>
                            goToAccountImportScreen({
                                xpubAddress: devXpubs[selectedCurrencySymbol] ?? devXpubs.btc,
                            })
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
