import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { initYieldAllowanceThunk, stablecoinYieldActions } from '@suite-common/wallet-core';
import { Box, Card, HStack, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    type YieldStackRoutes,
} from '@suite-native/navigation';

import { YieldSupplyAmountInputCard } from '../components/YieldSupplyAmountInputCard';
import { YieldSupplyApprovedAmountCard } from '../components/YieldSupplyApprovedAmountCard';
import { YieldSupplyFlowFooter } from '../components/YieldSupplyFlowFooter';
import { YieldSupplyFlowScreenHeader } from '../components/YieldSupplyFlowScreenHeader';
import { YieldSupplyInfoBottomSheet } from '../components/YieldSupplyInfoBottomSheet';
import { YieldSupplyStepCard } from '../components/YieldSupplyStepCard';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useYieldSession } from '../hooks/useYieldSession';
import { useYieldSupplyForm } from '../hooks/useYieldSupplyForm';
import { useYieldSupplySubmit } from '../hooks/useYieldSupplySubmit';
import {
    isYieldApprovalAllowanceEnough,
    isYieldApprovalAllowanceUnlimited,
} from '../yieldApprovalUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldSupply>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldSupply>;

export const YieldSupplyScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const { CryptoAmountFormatter } = useFormatters();
    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal();
    const {
        account,
        apy,
        flowData,
        flowKey,
        token,
        tokenSymbol,
        vault,
        vaultTokenName,
        resolutionStatus,
    } = useResolvedYieldFlowData(route.params);
    const session = useYieldSession({
        flowKey,
        flowType: 'deposit',
    });
    const supplyAmount = session?.action.amount;
    const allowanceAmount = session?.approval.allowanceAmount;
    const allowanceStatus = session?.approval.allowanceStatus;
    const isActionSubmitting = session?.action.isSubmitting ?? false;
    const isApprovedAmountUnlimited = isYieldApprovalAllowanceUnlimited({ session, token });
    const isAllowanceLoaded = allowanceStatus === 'loaded';
    const isSupplySessionReady = session?.step === 'action' && !!supplyAmount && isAllowanceLoaded;
    const shouldRefreshAllowance = resolutionStatus === 'resolved' && allowanceStatus === 'idle';
    const supplyForm = useYieldSupplyForm({
        defaultAmount: supplyAmount,
        token,
        tokenSymbol,
    });
    const { amountValue, form, handleAmountChange, handleMaxChange, isMaxSelected } = supplyForm;
    const {
        formState: { isValid },
    } = form;
    const isApprovalIncreaseRequired =
        isAllowanceLoaded &&
        !isYieldApprovalAllowanceEnough({
            amount: amountValue,
            session,
            token,
        });
    const isSubmitDisabled =
        !isSupplySessionReady || !isValid || !amountValue || isActionSubmitting;

    useEffect(() => {
        if (shouldRefreshAllowance) {
            void dispatch(
                initYieldAllowanceThunk({
                    flowData,
                    flowKey,
                    flowType: 'deposit',
                    // Mobile supply screen only refreshes display/guards here.
                    shouldSkipApprovalStep: false,
                }),
            );
        }
    }, [dispatch, flowData, flowKey, shouldRefreshAllowance]);

    const formattedApprovedAmount = useMemo(() => {
        if (!allowanceAmount || !tokenSymbol || isApprovedAmountUnlimited) {
            return null;
        }

        return CryptoAmountFormatter.format(allowanceAmount, {
            symbol: tokenSymbol,
            isBalance: true,
            withSymbol: true,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        });
    }, [CryptoAmountFormatter, isApprovedAmountUnlimited, allowanceAmount, tokenSymbol]);

    const handleEditApproval = useCallback(() => {
        if (!flowKey) {
            return;
        }

        dispatch(stablecoinYieldActions.enterModifyMode({ flowType: 'deposit', flowKey }));
        navigation.goBack();
    }, [dispatch, flowKey, navigation]);
    const { handleSubmitSupply } = useYieldSupplySubmit({
        amount: amountValue,
        flowData,
        flowKey,
        onApprovalRequired: handleEditApproval,
    });

    const handleContinue = useCallback(() => {
        if (isApprovalIncreaseRequired) {
            handleEditApproval();

            return;
        }

        void handleSubmitSupply();
    }, [handleEditApproval, handleSubmitSupply, isApprovalIncreaseRequired]);
    const footerTranslationId = isApprovalIncreaseRequired
        ? 'earn.yieldSupplyFlowScreen.increaseApprovalLimit'
        : undefined;

    if (resolutionStatus !== 'resolved' || !isSupplySessionReady) {
        return null;
    }

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldSupplyFlowScreenHeader
                    account={account}
                    closeAction={handleEditApproval}
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={route.params.tokenContract}
                    vaultName={vault.metadata.name}
                />
            }
            footer={
                <YieldSupplyFlowFooter
                    amountValue={amountValue}
                    apy={apy}
                    buttonTranslationId={footerTranslationId}
                    isDisabled={isSubmitDisabled}
                    isLoading={isActionSubmitting}
                    onPress={handleContinue}
                    tokenSymbol={tokenSymbol}
                />
            }
        >
            <VStack spacing="sp16">
                <YieldSupplyStepCard currentStepIndex={1} />

                <Box paddingHorizontal="sp16">
                    <YieldSupplyApprovedAmountCard
                        approvedAmount={formattedApprovedAmount}
                        isApprovedAmountUnlimited={isApprovedAmountUnlimited}
                        networkSymbol={account.symbol}
                        onEditApprovalPress={handleEditApproval}
                        tokenContract={route.params.tokenContract}
                    />
                </Box>

                <Box paddingHorizontal="sp16">
                    <Form form={form}>
                        <YieldSupplyAmountInputCard
                            balance={token.balance}
                            isMaxSelected={isMaxSelected}
                            onAmountChange={handleAmountChange}
                            onMaxChange={handleMaxChange}
                            tokenSymbol={tokenSymbol}
                        />
                    </Form>
                </Box>

                <Box paddingHorizontal="sp16">
                    <Card>
                        <HStack alignItems="center" justifyContent="space-between">
                            <Text variant="body-sm">
                                <Translation id="transactionManagement.fees.description.title.ethereum" />
                            </Text>
                            <HStack alignItems="center" spacing="sp12">
                                <VStack spacing={0} alignItems="flex-end">
                                    <Text variant="body-sm">
                                        <Translation id="earn.notAvailableShort" />
                                    </Text>
                                </VStack>
                                <Icon name="caretDown" size="medium" color="contentPrimary" />
                            </HStack>
                        </HStack>
                    </Card>
                </Box>
            </VStack>

            <YieldSupplyInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={closeInfoBottomSheet}
                tokenSymbol={tokenSymbol}
                vaultTokenName={vaultTokenName}
            />
        </Screen>
    );
};
