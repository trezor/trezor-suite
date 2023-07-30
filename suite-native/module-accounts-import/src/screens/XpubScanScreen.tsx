import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { Box, Button, Card, TextDivider, VStack } from '@suite-native/atoms';
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
import { NetworkType, networks } from '@suite-common/wallet-config';
import { isAddressValid } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';

import { XpubImportSection } from '../components/XpubImportSection';
import { AccountImportHeader } from '../components/AccountImportHeader';
import { DevXpub } from '../components/DevXpub';
import { SelectableNetworkItem } from '../components/SelectableNetworkItem';
import { XpubHint } from '../components/XpubHint';
import { XpubHintBottomSheet } from '../components/XpubHintBottomSheet';

const networkTypeToInputLabelMap: Record<NetworkType, string> = {
    bitcoin: 'Enter public key (XPUB) manually',
    cardano: 'Enter public key (XPUB) manually',
    ethereum: 'Enter receive address manually',
    ripple: 'Enter receive address manually',
};

const cameraStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    marginTop: 20,
    marginBottom: utils.spacings.medium,
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
    const { showAlert, hideAlert } = useAlert();
    const form = useForm<XpubFormValues>({
        validation: xpubFormValidationSchema,
    });
    const { handleSubmit, setValue, watch, reset } = form;
    const watchXpubAddress = watch('xpubAddress');
    const { networkSymbol } = route.params;
    const [isHintSheetVisible, setIsHintSheetVisible] = useState(false);

    const resetToDefaultValues = useCallback(() => {
        setIsCameraRequested(false);
    }, []);

    useFocusEffect(resetToDefaultValues);

    const { networkType, name: networkName } = networks[networkSymbol];
    const inputLabel = networkTypeToInputLabelMap[networkType];

    const goToAccountImportScreen = ({ xpubAddress }: XpubFormValues) => {
        if (
            xpubAddress &&
            networkType !== 'ethereum' &&
            isAddressValid(xpubAddress, networkSymbol)
        ) {
            // we need to set timeout to avoid showing alert during screen transition, otherwise it will freeze the app
            setTimeout(() => {
                showAlert({
                    title: 'This is your receive address',
                    description: 'To check the balance of your coin, scan your public key (XPUB).',
                    icon: 'warningCircle',
                    pictogramVariant: 'red',
                    primaryButtonTitle: 'Got it',
                    onPressPrimaryButton: () => null,
                    secondaryButtonTitle: 'Where to find it?',
                    onPressSecondaryButton: () => {
                        hideAlert();
                        setIsHintSheetVisible(true);
                    },
                });
            }, 1000);
            return;
        }

        navigation.navigate(AccountsImportStackRoutes.AccountImportLoading, {
            xpubAddress,
            networkSymbol,
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
        [watchXpubAddress, setValue, onXpubFormSubmit],
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
            networkSymbol,
        });
    };

    return (
        <Screen
            header={<AccountImportHeader activeStep={2} />}
            footer={
                <XpubHint
                    networkType={networkType}
                    handleOpen={() => setIsHintSheetVisible(true)}
                />
            }
        >
            <Card>
                <SelectableNetworkItem
                    cryptoCurrencyName={networkName}
                    cryptoCurrencySymbol={networkSymbol}
                    iconName={networkSymbol}
                    onPressActionButton={() => navigation.goBack()}
                />
            </Card>
            <Box marginHorizontal="medium">
                <View style={applyStyle(cameraStyle)}>
                    <XpubImportSection
                        onRequestCamera={handleRequestCamera}
                        networkSymbol={networkSymbol}
                    />
                </View>

                <TextDivider title="OR" />
                <Form form={form}>
                    <VStack spacing="medium">
                        <TextInputField
                            data-testID="@accounts-import/sync-coins/xpub-input"
                            name="xpubAddress"
                            label={inputLabel}
                        />
                        <Button
                            data-testID="@accounts-import/sync-coins/xpub-submit"
                            onPress={onXpubFormSubmit}
                            size="large"
                            isDisabled={!watchXpubAddress?.length}
                        >
                            Confirm
                        </Button>
                    </VStack>
                </Form>
                {isDevelopOrDebugEnv() && (
                    <DevXpub symbol={networkSymbol} onSelect={goToAccountImportScreen} />
                )}
            </Box>
            <XpubHintBottomSheet
                networkType={networkType}
                isVisible={isHintSheetVisible}
                handleClose={() => setIsHintSheetVisible(false)}
            />
        </Screen>
    );
};
