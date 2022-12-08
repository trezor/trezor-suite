import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { Button, Card, TextDivider, VStack } from '@suite-native/atoms';
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
import { networks } from '@suite-common/wallet-config';

import { XpubImportSection } from '../components/XpubImportSection';
import { AccountImportHeader } from '../components/AccountImportHeader';
import { DevXpub } from '../components/DevXpub';
import { SelectableNetworkItem } from '../components/SelectableNetworkItem';

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

    const form = useForm<XpubFormValues>({
        validation: xpubFormValidationSchema,
    });
    const { handleSubmit, setValue, watch, reset } = form;
    const watchXpubAddress = watch('xpubAddress');
    const selectedCurrencySymbol = route.params.networkSymbol;

    const resetToDefaultValues = useCallback(() => {
        setIsCameraRequested(false);
    }, []);

    useFocusEffect(resetToDefaultValues);

    const goToAccountImportScreen = ({ xpubAddress }: XpubFormValues) => {
        navigation.navigate(AccountsImportStackRoutes.AccountImport, {
            xpubAddress,
            networkSymbol: selectedCurrencySymbol,
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
        navigation.navigate(AccountsImportStackRoutes.XpubScanModal, {
            networkSymbol: selectedCurrencySymbol,
        });
    };

    return (
        <Screen header={<AccountImportHeader activeStep={2} />}>
            <Card>
                <SelectableNetworkItem
                    cryptoCurrencyName={networks[selectedCurrencySymbol].name}
                    cryptoCurrencySymbol={selectedCurrencySymbol}
                    iconName={selectedCurrencySymbol}
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
                <DevXpub symbol={selectedCurrencySymbol} onSelect={goToAccountImportScreen} />
            )}
        </Screen>
    );
};
