import { useCallback } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import { activateStellarTokenThunk } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Box, Button, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/confirm-on-trezor';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackProps,
    StackToStackCompositeNavigationProps,
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

type NavigationProp = StackToStackCompositeNavigationProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.ActivationFee,
    RootStackParamList
>;

export const ActivationFeeScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract } = route.params;
    const navigation = useNavigation<NavigationProp>();

    const handleSuccess = useCallback(() => {
        // Navigate to home page after activation
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
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
        selectedFeeLevel,
        formDraft,
        handleFeeLevelChange,
        handleCustomFeeSet,
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
            <ConfirmOnTrezorWrapper
                isManualControlEnabled
                controlRef={confirmOnTrezorRef}
                closeActionType="back"
                closeAction={handleCancel}
                defaultHeader={
                    <ScreenHeader
                        title={<Translation id="moduleStellarToken.screenTitle.activateToken" />}
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
                        <Text variant="body-md" color="textSubdued">
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
                                            textVariant="body-md"
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
                            accountKey={accountKey}
                            feeLevels={feeLevels}
                            symbol={account.symbol}
                            areFeesLoading={areFeesLoading}
                            selectedFeeLevel={selectedFeeLevel}
                            onSelectedFeeLevel={handleFeeLevelChange}
                            onCustomFeeSet={handleCustomFeeSet}
                            formDraft={formDraft}
                        />
                    </VStack>

                    {/* Footer Button */}
                    <Box paddingBottom="sp16">
                        <Button
                            onPress={handleReviewAndSign}
                            isLoading={isSubmitting}
                            isDisabled={isSubmitting || !isSubmittable || !!insufficientBalanceInfo}
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
        </Form>
    );
};
