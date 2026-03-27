import { useCallback } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import { deactivateStellarTokenThunk } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Box, Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { ConfirmOnTrezorWrapper } from '@suite-native/confirm-on-trezor';
import { Form } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackProps,
    type StackToStackCompositeNavigationProps,
    type StellarManageTokenStackParamList,
    type StellarManageTokenStackRoutes,
} from '@suite-native/navigation';
import { BASE_INFO } from '@trezor/blockchain-link-stellar/src/utils';

import { FeeOptionsSection } from '../components/FeeOptionsSection';
import { TokenDetailBottomSheet } from '../components/TokenDetailBottomSheet';
import { TokenInfoCard } from '../components/TokenInfoCard';
import { useStellarFeeScreen } from '../hooks/useStellarFeeScreen';

type RouteProps = StackProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.DeactivationFee
>['route'];

type NavigationProp = StackToStackCompositeNavigationProps<
    StellarManageTokenStackParamList,
    StellarManageTokenStackRoutes.DeactivationFee,
    RootStackParamList
>;

export const DeactivationFeeScreen = () => {
    const route = useRoute<RouteProps>();
    const { accountKey, tokenContract } = route.params;
    const navigation = useNavigation<NavigationProp>();

    const handleSuccess = useCallback(() => {
        // Navigate to home page after deactivation
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
        mode: 'deactivation',
        thunkAction: deactivateStellarTokenThunk,
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
                        title={<Translation id="moduleStellarToken.screenTitle.deactivateToken" />}
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

                        {/* Warning Info */}
                        <Card>
                            <HStack alignItems="center" spacing="sp12">
                                <Icon name="info" color="iconSubdued" />
                                <Box flex={1}>
                                    <Text variant="body-md">
                                        <Translation
                                            id="moduleStellarToken.deactivationFee.warningText"
                                            values={{
                                                reserve: formatNetworkAmount(
                                                    BASE_INFO.BASE_RESERVE.toString(),
                                                    account.symbol,
                                                    true,
                                                ),
                                            }}
                                        />
                                    </Text>
                                </Box>
                            </HStack>
                        </Card>

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
                            isDisabled={isSubmitting || !isSubmittable}
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
