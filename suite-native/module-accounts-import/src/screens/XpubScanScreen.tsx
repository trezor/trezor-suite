import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useFocusEffect } from '@react-navigation/native';

import { Button, HeaderedCard, TextDivider, VStack } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { Form, TextInputField, useForm } from '@suite-native/forms';
import {
    AccountsImportStackParamList,
    AccountsImportStackRoutes,
    Screen,
    StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { getNetworkType } from '@suite-common/wallet-config';
import { isAddressValid, isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { Alert, useAlert } from '@suite-native/alerts';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    XpubFormContext,
    xpubFormValidationSchema,
    XpubFormValues,
    // TODO: This direct import is needed to avoid importing the `@suite-common/wallet-utils`
    // to the `connect` packages. Should be revisited soon when fixing the monorepo tree shaking problems.
} from '@suite-common/validators/src/schemas/xpubSchema';
import { SelectableNetworkItem } from '@suite-native/accounts';

import { XpubImportSection } from '../components/XpubImportSection';
import { AccountImportSubHeader } from '../components/AccountImportSubHeader';
import { DevXpub } from '../components/DevXpub';
import { XpubHint } from '../components/XpubHint';
import { XpubHintBottomSheet } from '../components/XpubHintBottomSheet';

const FORM_BUTTON_FADE_IN_DURATION = 200;

// Extra padding needed to make multiline xpub input form visible even with the sticky footer.
const EXTRA_KEYBOARD_AVOIDING_VIEW_HEIGHT = 350;

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
    const [_, setIsCameraRequested] = useState<boolean>(false);
    const { showAlert, hideAlert } = useAlert();

    const { networkSymbol } = route.params;
    const networkType = getNetworkType(networkSymbol);

    const form = useForm<XpubFormValues, XpubFormContext>({
        validation: xpubFormValidationSchema,
        context: { networkSymbol },
    });
    const { handleSubmit, setValue, watch, reset } = form;
    const watchXpubAddress = watch('xpubAddress');
    const [isHintSheetVisible, setIsHintSheetVisible] = useState(false);

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
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: (
                    <Translation id="moduleAccountImport.xpubScanScreen.confirmButton" />
                ),
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
                description: (
                    <Translation id="moduleAccountImport.xpubScanScreen.alert.address.description" />
                ),
                icon: 'warningCircle',
                pictogramVariant: 'red',
                primaryButtonTitle: (
                    <Translation id="moduleAccountImport.xpubScanScreen.confirmButton" />
                ),
                onPressPrimaryButton: () => null,
                secondaryButtonTitle: (
                    <Translation id="moduleAccountImport.xpubScanScreen.alert.address.hintButton" />
                ),
                onPressSecondaryButton: () => {
                    hideAlert();
                    setIsHintSheetVisible(true);
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

    const handleRequestCamera = () => {
        reset({
            xpubAddress: '',
        });
        navigation.navigate(AccountsImportStackRoutes.XpubScanModal, {
            networkSymbol,
        });
    };

    const handleOpenHint = () => setIsHintSheetVisible(true);
    const handleGoBack = () => navigation.goBack();

    return (
        <Screen
            screenHeader={<AccountImportSubHeader />}
            footer={<XpubHint networkType={networkType} handleOpen={handleOpenHint} />}
            extraKeyboardAvoidingViewHeight={EXTRA_KEYBOARD_AVOIDING_VIEW_HEIGHT}
        >
            <HeaderedCard
                title="Coin to sync"
                buttonTitle="Change"
                buttonIcon="discover"
                onButtonPress={handleGoBack}
            >
                <SelectableNetworkItem symbol={networkSymbol} />
            </HeaderedCard>
            <VStack spacing="medium" marginHorizontal="medium">
                <View style={applyStyle(cameraStyle)}>
                    <XpubImportSection
                        onRequestCamera={handleRequestCamera}
                        networkSymbol={networkSymbol}
                    />
                </View>

                <TextDivider
                    title="generic.orSeparator"
                    lineColor="borderElevation0"
                    textColor="textSubdued"
                />
                <Form form={form}>
                    <VStack spacing="medium">
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
                                    Confirm
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
                isVisible={isHintSheetVisible}
                handleClose={() => setIsHintSheetVisible(false)}
            />
        </Screen>
    );
};
