import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useFocusEffect } from '@react-navigation/native';

import {
    type XpubFormContext,
    type XpubFormValues,
    xpubFormValidationSchema,
} from '@suite-common/validators';
import { getNetworkType } from '@suite-common/wallet-config';
import { isAddressBasedNetwork, isAddressValid } from '@suite-common/wallet-utils';
import { SelectableNetworkItem } from '@suite-native/accounts';
import { type Alert, useAlert } from '@suite-native/alerts';
import { Button, Card, TextDivider, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    type AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';
import { ScanQRBottomSheet } from '@suite-native/qr-code';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountImportScreenHeader } from '../components/AccountImportScreenHeader';
import { DevXpub } from '../components/DevXpub';
import { XpubHint } from '../components/XpubHint';
import { XpubHintBottomSheet } from '../components/XpubHintBottomSheet';
import { XpubImportSection, networkTypeToTitleTxKeyMap } from '../components/XpubImportSection';

const FORM_BUTTON_FADE_IN_DURATION = 200;

const cameraStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    marginTop: 20,
}));

const isBtcTestnetXpub = (xpubAddress: string) => {
    // This is to strip the start section of taproot xpubs
    const xpub = xpubAddress.slice(xpubAddress.indexOf(']') + 1);

    const btcTestnetPrefixes = ['tpub', 'upub', 'vpub', 'Upub', 'Vpub'];

    return btcTestnetPrefixes.some(prefix => prefix === xpub.slice(0, 4));
};

export const XpubScanScreen = ({
    navigation,
    route,
}: StackProps<AccountsImportStackParamList, AccountsImportStackRoutes.XpubScan>) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const [_, setIsCameraRequested] = useState(false);
    const {
        bottomSheetRef: xpubHintRef,
        openModal: openXpubHint,
        closeModal: closeXpubHint,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: scannerRef,
        openModal: openScanner,
        closeModal: closeScanner,
    } = useBottomSheetModal();

    const { showAlert } = useAlert();

    const { networkSymbol } = route.params;
    const networkType = getNetworkType(networkSymbol);

    const form = useForm<XpubFormValues, XpubFormContext>({
        validation: xpubFormValidationSchema,
        context: { symbol: networkSymbol },
    });
    const { handleSubmit, setValue, watch } = form;
    const watchXpubAddress = watch('xpubAddress');

    const isXpubFormFilled = watchXpubAddress?.length > 0;

    const resetToDefaultValues = useCallback(() => {
        setIsCameraRequested(false);
    }, []);

    useFocusEffect(resetToDefaultValues);

    const inputLabel = translate(
        isAddressBasedNetwork(networkType)
            ? 'moduleAccountImport.xpubScanScreen.input.label.address'
            : 'moduleAccountImport.xpubScanScreen.input.label.xpub',
    );

    const showDelayedAlert = (alertProps: Alert) => {
        // we need to set timeout to avoid showing alert during screen transition, otherwise it will freeze the app
        setTimeout(() => {
            showAlert(alertProps);
        }, 1000);
    };

    const goToAccountImportScreen = ({ xpubAddress }: XpubFormValues) => {
        if (networkSymbol === 'btc' && isBtcTestnetXpub(xpubAddress)) {
            showDelayedAlert({
                title: <Translation id="moduleAccountImport.xpubScanScreen.alert.xpub.title" />,
                description: (
                    <Translation id="moduleAccountImport.xpubScanScreen.alert.xpub.description" />
                ),
                pictogramVariant: 'critical',
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
                onPressPrimaryButton: () => null,
            });

            return;
        }

        // This is only to verify the bitcoin based networks. If you supply address instead of XPUB, it should fail here.
        if (
            xpubAddress &&
            !isAddressBasedNetwork(networkType) &&
            isAddressValid(xpubAddress, networkSymbol)
        ) {
            showDelayedAlert({
                title: <Translation id="moduleAccountImport.xpubScanScreen.alert.address.title" />,
                testID: '@alert-sheet/error/invalidXpub',
                description: (
                    <Translation id="moduleAccountImport.xpubScanScreen.alert.address.description" />
                ),
                pictogramVariant: 'critical',
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
                onPressPrimaryButton: () => null,
                secondaryButtonTitle: (
                    <Translation id="moduleAccountImport.xpubScanScreen.alert.address.hintButton" />
                ),
                onPressSecondaryButton: () => {
                    openXpubHint();
                },
            });

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

    const handleBarCodeScanned = (data: string) => {
        setValue('xpubAddress', data);
        onXpubFormSubmit();
    };

    return (
        <Screen
            header={<AccountImportScreenHeader closeActionType="back" />}
            footer={<XpubHint networkType={networkType} handleOpen={openXpubHint} />}
            focusedInputBottomOffset={163} // button height with vertical margin + footer height
        >
            <Card>
                <SelectableNetworkItem symbol={networkSymbol} />
            </Card>
            <VStack spacing="sp16">
                <View style={applyStyle(cameraStyle)}>
                    <XpubImportSection onRequestCamera={openScanner} symbol={networkSymbol} />
                </View>

                <TextDivider
                    title="generic.orSeparator"
                    lineColor="borderElevation0"
                    textColor="textSubdued"
                />
                <Form form={form}>
                    <VStack spacing="sp16">
                        <TextInputField
                            testID="@accounts-import/sync-coins/xpub-input"
                            name="xpubAddress"
                            label={inputLabel}
                            accessibilityLabel={inputLabel}
                            multiline
                        />
                        {isXpubFormFilled && (
                            <Animated.View entering={FadeIn.duration(FORM_BUTTON_FADE_IN_DURATION)}>
                                <Button
                                    testID="@accounts-import/sync-coins/xpub-submit"
                                    onPress={onXpubFormSubmit}
                                    size="large"
                                >
                                    <Translation id="generic.buttons.confirm" />
                                </Button>
                            </Animated.View>
                        )}
                    </VStack>
                </Form>
                {isDevelopOrDebugEnv() && (
                    <DevXpub symbol={networkSymbol} onSelect={goToAccountImportScreen} />
                )}
            </VStack>
            <XpubHintBottomSheet
                networkType={networkType}
                ref={xpubHintRef}
                handleClose={closeXpubHint}
            />
            <ScanQRBottomSheet
                title={<Translation id={networkTypeToTitleTxKeyMap[networkType]} />}
                onCodeScanned={handleBarCodeScanned}
                ref={scannerRef}
                onClose={closeScanner}
            />
        </Screen>
    );
};
