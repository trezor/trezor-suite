import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { Box, Button, Card, Text, TextDivider, VStack } from '@suite-native/atoms';
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

import { XpubImportSection } from '../components/XpubImportSection';
import { AccountImportHeader } from '../components/AccountImportHeader';
import { selectSelectedCoin } from '../accountsImportSlice';
import { DevXpub } from '../components/DevXpub';
import { SelectableAssetItem } from '../components/SelectableAssetItem';

const cameraStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 45,
}));

const xpubFormValidationSchema = yup.object({
    xpubAddress: yup.string().required(),
});
type XpubFormValues = yup.InferType<typeof xpubFormValidationSchema>;

export const XpubScanScreen = ({
    navigation,
    route,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScan>) => {
    const { applyStyle } = useNativeStyles();
    const [_, setIsCameraRequested] = useState<boolean>(false);
    const selectedCoin = useSelector(selectSelectedCoin);

    const form = useForm<XpubFormValues>({
        validation: xpubFormValidationSchema,
    });
    const { handleSubmit, setValue, watch, reset } = form;
    const watchXpubAddress = watch('xpubAddress');

    const resetToDefaultValues = useCallback(() => {
        setIsCameraRequested(false);
    }, []);

    useFocusEffect(resetToDefaultValues);

    const goToAccountImportScreen = ({ xpubAddress }: XpubFormValues) => {
        navigation.navigate(AccountsImportStackRoutes.AccountImport, {
            xpubAddress,
            currencySymbol: selectedCoin.cryptoCurrencySymbol,
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

    const handleRequestCamera = () => {
        reset({
            xpubAddress: '',
        });
        navigation.navigate(AccountsImportStackRoutes.XpubScanModal);
    };

    return (
        <Screen header={<AccountImportHeader activeStep={2} />}>
            <Box>
                <Box alignItems="center" marginBottom="medium">
                    <Box marginBottom="medium">
                        <Text variant="titleMedium">XPUB Import</Text>
                    </Box>
                </Box>
                <Card>
                    <SelectableAssetItem
                        cryptoCurrencyName={selectedCoin.cryptoCurrencyName}
                        cryptoCurrencySymbol={selectedCoin.cryptoCurrencySymbol}
                        iconName={selectedCoin.iconName}
                        onPressActionButton={() => navigation.goBack()}
                    />
                </Card>
                <View style={applyStyle(cameraStyle)}>
                    <XpubImportSection onRequestCamera={handleRequestCamera} />
                </View>
                <TextDivider title="OR" />
                <Form form={form}>
                    <VStack spacing="medium">
                        <TextInputField name="xpubAddress" label="Enter x-pub..." />
                        <Button
                            onPress={onXpubFormSubmit}
                            size="large"
                            isDisabled={!watchXpubAddress?.length}
                        >
                            Submit
                        </Button>
                    </VStack>
                </Form>
                {isDevelopOrDebugEnv() && (
                    <DevXpub
                        symbol={selectedCoin.cryptoCurrencySymbol}
                        onSelect={goToAccountImportScreen}
                    />
                )}
            </Box>
        </Screen>
    );
};
