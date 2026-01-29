import { useCallback } from 'react';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';

import { activateStellarTokenThunk } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Box, Button, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/device';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import {
    AppTabsRoutes,
    RootStackRoutes,
    ScreenHeader,
    StackProps,
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import { BASE_INFO } from '@trezor/blockchain-link-utils/src/stellar';
import { HELP_CENTER_XLM_URL } from '@trezor/urls';

import { FeeOptionsSection } from '../components/FeeOptionsSection';
import { TokenDetailBottomSheet } from '../components/TokenDetailBottomSheet';
import { TokenInfoCard } from '../components/TokenInfoCard';
import { useStellarFeeScreen } from '../hooks/useStellarFeeScreen';

type RouteProps = StackProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.ActivationFee
>['route'];

export const ActivationFeeScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract } = route.params;
    const navigation = useNavigation();

    const handleSuccess = useCallback(() => {
        // Navigate to home page after activation
        navigation.getParent()?.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
        });
    }, [navigation]);

    const {
        account,
        isSubmitting,
        isSubmittable,
        insufficientBalanceInfo,
        areFeesLoading,
        form,
        feeLevels,
        assetCode,
        tokenName,
        issuerDomain,
        issuerAddress,
        iconContractAddress,
        tokenDetailRef,
        openTokenDetail,
        closeTokenDetail,
        confirmOnTrezorRef,
        handleCancel,
        handleReviewAndSign,
    } = useStellarFeeScreen({
        accountKey,
        tokenContract,
        mode: 'activation',
        thunkAction: activateStellarTokenThunk,
        onSuccess: handleSuccess,
    });

    if (!account) return null;

    return (
        <Form form={form}>
            <BottomSheetModalProvider>
                <ConfirmOnTrezorWrapper
                    isManualControlEnabled
                    controlRef={confirmOnTrezorRef}
                    closeActionType="back"
                    closeAction={handleCancel}
                    defaultHeader={
                        <ScreenHeader
                            title={
                                <Translation id="moduleStellarToken.screenTitle.activateToken" />
                            }
                            closeActionType="back"
                        />
                    }
                >
                    <Box flex={1} justifyContent="space-between">
                        <VStack spacing="sp16">
                            <TokenInfoCard
                                tokenName={tokenName}
                                issuerDomain={issuerDomain}
                                iconContractAddress={iconContractAddress}
                                onPress={openTokenDetail}
                            />

                            {/* Reserve Info */}
                            <Text variant="body" color="textSubdued">
                                <Translation
                                    id="moduleStellarToken.networkFee.reserveInfo"
                                    values={{
                                        reserve: formatNetworkAmount(
                                            BASE_INFO.BASE_RESERVE.toString(),
                                            account.symbol,
                                            true,
                                        ),
                                        link: chunks => (
                                            <Link
                                                href={HELP_CENTER_XLM_URL}
                                                label={chunks}
                                                isUnderlined
                                                textColor="textSubdued"
                                                textPressedColor="textSubdued"
                                                textVariant="body"
                                            />
                                        ),
                                    }}
                                />
                            </Text>

                            {/* Insufficient Balance Warning */}
                            {insufficientBalanceInfo && (
                                <InlineAlertBox
                                    variant="warning"
                                    title={
                                        <Translation
                                            id="moduleStellarToken.networkFee.insufficientBalance"
                                            values={{
                                                required: formatNetworkAmount(
                                                    insufficientBalanceInfo.required,
                                                    account.symbol,
                                                    true,
                                                ),
                                                available: formatNetworkAmount(
                                                    insufficientBalanceInfo.available,
                                                    account.symbol,
                                                    true,
                                                ),
                                            }}
                                        />
                                    }
                                />
                            )}

                            <FeeOptionsSection
                                feeLevels={feeLevels}
                                symbol={account.symbol}
                                isLoading={areFeesLoading}
                            />
                        </VStack>

                        {/* Footer Button */}
                        <Box paddingBottom="sp16">
                            <Button
                                onPress={handleReviewAndSign}
                                isLoading={isSubmitting}
                                isDisabled={
                                    isSubmitting || !isSubmittable || !!insufficientBalanceInfo
                                }
                                testID="@stellar-token/review-and-sign-button"
                            >
                                <Translation id="moduleStellarToken.networkFee.reviewAndSign" />
                            </Button>
                        </Box>
                    </Box>

                    <TokenDetailBottomSheet
                        bottomSheetRef={tokenDetailRef}
                        tokenName={tokenName}
                        assetCode={assetCode}
                        issuerDomain={issuerDomain}
                        issuerAddress={issuerAddress}
                        iconContractAddress={iconContractAddress}
                        onClose={closeTokenDetail}
                    />
                </ConfirmOnTrezorWrapper>
            </BottomSheetModalProvider>
        </Form>
    );
};
