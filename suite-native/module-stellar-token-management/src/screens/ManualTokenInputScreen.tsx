import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation, useRoute } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Box, Button, Card, Input, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type StackNavigationProps,
    type StackProps,
    type StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import { isValidAddress, isValidAssetCode } from '@trezor/blockchain-link-utils/src/stellar';

import { composeStellarTrustlineFeesThunk } from '../thunks';

type RouteProps = StackProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.ManualTokenInput
>['route'];

type NavigationProps = StackNavigationProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.ManualTokenInput
>;

export const ManualTokenInputScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey } = route.params;
    const navigation = useNavigation<NavigationProps>();
    const { translate } = useTranslate();
    const { showAlert } = useAlert();
    const dispatch = useDispatch();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const [assetCode, setAssetCode] = useState('');
    const [issuerAddress, setIssuerAddress] = useState('');
    const [assetCodeTouched, setAssetCodeTouched] = useState(false);
    const [issuerAddressTouched, setIssuerAddressTouched] = useState(false);
    const [isComposingFees, setIsComposingFees] = useState(false);

    // Validation
    const isAssetCodeValid = isValidAssetCode(assetCode);
    const isIssuerAddressValid = isValidAddress(issuerAddress);

    const hasAssetCodeError = assetCodeTouched && !!assetCode && !isAssetCodeValid;
    const hasIssuerAddressError = issuerAddressTouched && !!issuerAddress && !isIssuerAddressValid;

    const isFormValid = assetCode && issuerAddress && isAssetCodeValid && isIssuerAddressValid;

    const handleAssetCodeChange = useCallback((value: string) => {
        setAssetCode(value.toUpperCase());
    }, []);

    const handleIssuerAddressChange = useCallback((value: string) => {
        setIssuerAddress(value.toUpperCase());
    }, []);

    const handleContinue = useCallback(async () => {
        if (!isFormValid) return;

        const tokenContract = `${assetCode}-${issuerAddress}` as TokenAddress;

        setIsComposingFees(true);
        try {
            // Compose fee levels BEFORE navigating (like trading module)
            const result = await dispatch(
                composeStellarTrustlineFeesThunk({ accountKey, tokenContract }),
            );

            if (isFulfilled(result)) {
                navigation.navigate(StellarManageTokenStackRoutes.ActivationFee, {
                    accountKey,
                    tokenContract,
                });
            } else {
                // Show error when fee composition fails (e.g., offline/slow fetch)
                showAlert({
                    title: translate('moduleStellarToken.networkFee.activationFailed'),
                    description: translate(
                        'moduleStellarToken.networkFee.activationFailedDescription',
                    ),
                    primaryButtonTitle: translate('generic.buttons.gotIt'),
                });
            }
        } finally {
            setIsComposingFees(false);
        }
    }, [
        accountKey,
        assetCode,
        dispatch,
        isFormValid,
        issuerAddress,
        navigation,
        showAlert,
        translate,
    ]);

    if (!account) return null;

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleStellarToken.screenTitle.activateToken" />}
                    closeActionType="back"
                />
            }
            footer={
                <Box paddingHorizontal="sp16" paddingBottom="sp16">
                    <Button
                        onPress={handleContinue}
                        isDisabled={!isFormValid || isComposingFees}
                        isLoading={isComposingFees}
                        testID="@stellar-token/manual-continue-button"
                    >
                        <Translation id="generic.buttons.continue" />
                    </Button>
                </Box>
            }
        >
            <VStack spacing="sp24">
                <VStack spacing="sp8">
                    <Text variant="headline-md">
                        <Translation id="moduleStellarToken.manualInput.title" />
                    </Text>
                    <Text variant="body-md" color="contentSecondary">
                        <Translation id="moduleStellarToken.manualInput.subtitle" />
                    </Text>
                </VStack>

                <Card>
                    <VStack spacing="sp16">
                        <VStack spacing="sp8">
                            <Text variant="body-md">
                                <Translation id="moduleStellarToken.manualInput.assetCode" />
                            </Text>
                            <Input
                                value={assetCode}
                                onChangeText={handleAssetCodeChange}
                                onBlur={() => setAssetCodeTouched(true)}
                                placeholder={translate(
                                    'moduleStellarToken.manualInput.assetCodePlaceholder',
                                )}
                                autoCapitalize="characters"
                                maxLength={12}
                                hasError={hasAssetCodeError}
                                testID="@stellar-token/asset-code-input"
                            />
                            {hasAssetCodeError && (
                                <Text variant="body-sm" color="contentCritical">
                                    <Translation id="moduleStellarToken.manualInput.assetCodeError" />
                                </Text>
                            )}
                        </VStack>

                        <VStack spacing="sp8">
                            <Text variant="body-md">
                                <Translation id="moduleStellarToken.tokenDetail.issuerAddress" />
                            </Text>
                            <Input
                                value={issuerAddress}
                                onChangeText={handleIssuerAddressChange}
                                onBlur={() => setIssuerAddressTouched(true)}
                                placeholder={translate(
                                    'moduleStellarToken.manualInput.issuerAddressPlaceholder',
                                )}
                                autoCapitalize="characters"
                                multiline
                                hasError={hasIssuerAddressError}
                                testID="@stellar-token/issuer-address-input"
                            />
                            {hasIssuerAddressError && (
                                <Text variant="body-sm" color="contentCritical">
                                    <Translation id="moduleStellarToken.manualInput.issuerAddressError" />
                                </Text>
                            )}
                        </VStack>
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
