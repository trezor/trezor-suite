import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { Context } from '@suite-common/message-system';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getWithdrawRequestAmount,
    getYieldVaultContractAddress,
    getYieldWithdrawInputToken,
    splitYieldPendingTransaction,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { asAmountSubunit, getApyBreakdown, subunitsToUnits } from '@suite-common/wallet-utils';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    AnimatedDoubleInput,
    Box,
    Button,
    Card,
    HStack,
    Hint,
    Input,
    ScreenFooterGradient,
    Switch,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { decimalTransformer } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import { ContextMessage } from '@suite-native/message-system';
import {
    Screen,
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { FeeSelector, useTransactionDetails } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { BigNumber } from '@trezor/utils';

import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldFeeEstimationErrorAlert } from '../components/YieldFeeEstimationErrorAlert';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldWithdrawWarning } from '../components/YieldWithdrawWarning';
import { useMessageSystemYield } from '../hooks/useMessageSystemYield';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { useYieldWithdrawFees } from '../hooks/useYieldWithdrawFees';
import { getYieldWithdrawAmountValidationError } from '../utils/yieldWithdrawUtils';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdraw>;
type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldWithdraw>;

const withdrawFormCardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderNeutral,
    borderWidth: utils.borders.widths.small,
}));

const screenFooterStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillPage,
    paddingBottom: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp16,
}));

const withdrawOutputAmountInputStyle = prepareNativeStyle(utils => ({
    paddingRight: utils.spacings.sp64 + utils.spacings.sp32,
}));

const getYieldWithdrawFlowTypeByInputView = (
    activeView: 'primary' | 'secondary',
): YieldWithdrawFlowType => (activeView === 'secondary' ? 'redeem' : 'withdraw');

export const YieldWithdrawScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const { applyStyle } = useNativeStyles();
    const { CryptoAmountFormatter } = useFormatters();
    const { translate } = useTranslate();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const [assetAmount, setAssetAmount] = useState('');
    const [sharesAmount, setSharesAmount] = useState('');
    const [isMaxSelected, setIsMaxSelected] = useState(false);
    const [selectedFlowType, setSelectedFlowType] = useState<YieldWithdrawFlowType>(
        route.params.withdrawFlowType ?? 'withdraw',
    );
    // Redeeming the exact shares balance prevents leaving yield dust behind.
    const flowType: YieldWithdrawFlowType = isMaxSelected ? 'redeem' : selectedFlowType;
    const isMaxWithdrawInfoVisible = isMaxSelected && selectedFlowType === 'withdraw';
    const isSharesInput = flowType === 'redeem';
    const amount = isSharesInput ? sharesAmount : assetAmount;
    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal: openPendingBottomSheet,
    } = useBottomSheetModal();

    const {
        account,
        apy,
        bonusRewardTokenName,
        flowData,
        flowKey,
        resolutionStatus,
        depositedSharesAmount: resolvedDepositedSharesAmount,
        vault,
        vaultTokenSymbol: resolvedVaultTokenSymbol,
        vaultTokenName,
    } = useResolvedYieldFlowData(route.params);

    const vaultContractAddress = vault ? getYieldVaultContractAddress(vault) : undefined;
    const {
        isDisabled: isWithdrawDisabled,
        content: withdrawDisabledContent,
        variant: withdrawDisabledVariant,
    } = useMessageSystemYield('withdraw', { vaultContractAddress });

    useNavigateBackAnalytics({
        type: events.yieldNavigateEvent.name,
        payload: {
            action: 'cancel',
            from: 'withdraw-form',
            to: 'withdraw-form',
            networkSymbol: account?.symbol,
            vaultId: vault?.id,
        },
    });

    const activeInputToken = flowData
        ? getYieldWithdrawInputToken({ flowData, flowType })
        : undefined;
    const amountValidationError = getYieldWithdrawAmountValidationError({
        amount,
        decimals: activeInputToken?.decimals,
    });

    const depositedAmount = useMemo(() => {
        if (resolutionStatus !== 'resolved') {
            return null;
        }

        return getConvertedOutputTokenBalanceToInputTokenAmount({
            networkSymbol: account.symbol,
            token: vault.token,
            outputToken: vault.outputToken,
            outputTokenBalance: resolvedDepositedSharesAmount,
            pricePerShareState: vault.state?.pricePerShareState,
        });
    }, [account, resolutionStatus, resolvedDepositedSharesAmount, vault]);

    const depositedSharesAmount = useMemo(() => {
        if (resolutionStatus !== 'resolved') {
            return null;
        }

        return resolvedDepositedSharesAmount;
    }, [resolutionStatus, resolvedDepositedSharesAmount]);
    const maxAmount = isSharesInput ? depositedSharesAmount : depositedAmount;
    const isAmountTooHigh = useMemo(
        () => !!amount && !!maxAmount && new BigNumber(amount).gt(maxAmount),
        [amount, maxAmount],
    );
    const {
        fee: withdrawFee,
        formDraft: withdrawFeeFormDraft,
        formDraftKey: withdrawFeeFormDraftKey,
        hasFeeEstimationError,
        isComposingWithdrawFee,
        isFeeUnavailable,
        preparedAction,
        retryFeeEstimation,
        selectedFee: selectedWithdrawFee,
        updateFeeLevelThunk: updateWithdrawFeeLevelThunk,
    } = useYieldWithdrawFees({
        amount,
        flowType,
        flowData,
        flowKey,
        isEnabled:
            resolutionStatus === 'resolved' &&
            !!amount &&
            !isAmountTooHigh &&
            !amountValidationError,
    });
    const feeFiatConverters = useCryptoFiatConverters({
        symbol: account?.symbol ?? null,
    });
    const amountFiatTokenContract = activeInputToken?.contractAddress
        ? toTokenAddress(activeInputToken.contractAddress)
        : undefined;

    const amountFiatConverters = useCryptoFiatConverters({
        symbol: account?.symbol ?? null,
        tokenContract: amountFiatTokenContract,
    });

    const shouldShowNetworkFeeWarning = useMemo(() => {
        if (
            !amount ||
            amountValidationError ||
            !withdrawFee ||
            resolutionStatus !== 'resolved' ||
            preparedAction?.amount !== amount ||
            preparedAction.flowType !== flowType
        ) {
            return false;
        }

        const amountFiat = amountFiatConverters?.convertCryptoToFiat(new BigNumber(amount));
        const feeUnits = subunitsToUnits({
            value: asAmountSubunit(new BigNumber(withdrawFee)),
            symbol: account.symbol,
        });
        const feeFiat = feeFiatConverters?.convertCryptoToFiat(new BigNumber(feeUnits));

        return !!amountFiat && !!feeFiat && feeFiat.gt(amountFiat);
    }, [
        account,
        amount,
        amountValidationError,
        amountFiatConverters,
        feeFiatConverters,
        preparedAction,
        resolutionStatus,
        withdrawFee,
        flowType,
    ]);

    const isWithdrawReviewReady =
        !!amount &&
        preparedAction?.amount === amount &&
        preparedAction.flowType === flowType &&
        !!withdrawFeeFormDraft;

    const session = useYieldSession({
        flowKey,
        flowType,
        shouldDisposeOnGoBack: true,
    });
    const pendingTransaction = session?.action.pendingTransaction ?? null;
    const { actionPendingTransaction } = splitYieldPendingTransaction(pendingTransaction, flowType);
    const isWithdrawPending = !!actionPendingTransaction;
    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey: account?.key ?? null,
        txid: actionPendingTransaction?.txid ?? null,
    });
    const isSubmitDisabled =
        !amount ||
        isWithdrawPending ||
        isAmountTooHigh ||
        !!amountValidationError ||
        !isWithdrawReviewReady ||
        isComposingWithdrawFee ||
        isFeeUnavailable ||
        isWithdrawDisabled;

    useShowYieldTransactionFailureAlert({
        error: session?.error,
        flowKey,
        flowType,
        isEnabled: isFocused,
    });

    useYieldPendingTransactionTracking({
        account,
        flowKey,
        flowType,
        pendingTransaction: actionPendingTransaction,
        vault,
    });

    useEffect(() => {
        if (!isFocused || !isWithdrawPending) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, isWithdrawPending, openPendingBottomSheet]);

    useEffect(() => {
        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldWithdrawComplete, {
                ...route.params,
                withdrawFlowType: flowType,
            });
        }
    }, [flowType, navigation, route.params, session?.step]);

    const getSharesAmountFromAssetAmount = useCallback(
        (value: string) => {
            if (resolutionStatus !== 'resolved') {
                return '';
            }

            return (
                getWithdrawRequestAmount({
                    networkSymbol: account.symbol,
                    amount: value,
                    token: vault.token,
                    receiptToken: flowData.receiptToken,
                    pricePerShare: vault.state?.pricePerShareState?.price,
                }) ?? ''
            );
        },
        [account, flowData, resolutionStatus, vault],
    );

    const getAssetAmountFromSharesAmount = useCallback(
        (value: string) => {
            if (resolutionStatus !== 'resolved') {
                return '';
            }

            return getConvertedOutputTokenBalanceToInputTokenAmount({
                networkSymbol: account.symbol,
                token: vault.token,
                outputToken: vault.outputToken,
                outputTokenBalance: value,
                pricePerShareState: vault.state?.pricePerShareState,
            });
        },
        [account, resolutionStatus, vault],
    );

    const handleMaxChange = (value: boolean) => {
        setIsMaxSelected(value);

        if (!value || !depositedAmount || !depositedSharesAmount) {
            return;
        }

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'withdraw-max',
                value: isSharesInput ? 'shares' : 'asset',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });

        setAssetAmount(depositedAmount);
        setSharesAmount(depositedSharesAmount);
    };

    const handleAmountChange = (value: string) => {
        if (!flowData) {
            return;
        }

        const transformedValue = decimalTransformer(value);

        if (!transformedValue) {
            setAssetAmount('');
            setSharesAmount('');

            return;
        }

        if (isSharesInput) {
            setSharesAmount(transformedValue);
            setAssetAmount(getAssetAmountFromSharesAmount(transformedValue));

            return;
        }

        setAssetAmount(transformedValue);
        setSharesAmount(getSharesAmountFromAssetAmount(transformedValue));
    };

    const handleClose = useCallback(() => {
        if (isWithdrawPending) {
            openPendingBottomSheet();

            return;
        }

        navigation.goBack();
    }, [isWithdrawPending, navigation, openPendingBottomSheet]);

    const handleCloseInfoBottomSheet = useCallback(() => {
        closeInfoBottomSheet();

        if (isWithdrawPending) {
            requestAnimationFrame(openPendingBottomSheet);
        }
    }, [closeInfoBottomSheet, isWithdrawPending, openPendingBottomSheet]);

    const handleInputSwitch = useCallback(
        (activeView: 'primary' | 'secondary') => {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: {
                    element: 'withdraw-unit-toggle',
                    value: activeView === 'secondary' ? 'shares' : 'asset',
                    networkSymbol: account?.symbol,
                    vaultId: vault?.id,
                },
            });

            setIsMaxSelected(false);
            setSelectedFlowType(getYieldWithdrawFlowTypeByInputView(activeView));
        },
        [account?.symbol, analytics, vault?.id],
    );

    const handleContinue = useCallback(() => {
        if (!flowKey || !isWithdrawReviewReady || !preparedAction || isWithdrawDisabled) {
            return;
        }

        const apyBreakdown = getApyBreakdown(vault?.rewardRate?.components);

        analytics.report({
            type: events.yieldWithdrawEvent.name,
            payload: {
                action: 'continue',
                type: 'withdraw',
                operation: flowType,
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
                ...(apyBreakdown && { apyBreakdown }),
            },
        });

        dispatch(stablecoinYieldActions.discardTransaction());
        dispatch(
            stablecoinYieldActions.storeActionReviewData({
                amount: preparedAction.amount,
                flowKey,
                flowType,
                receiptAmount: preparedAction.amount,
                unsignedTransaction: preparedAction.unsignedTransaction,
            }),
        );
        navigation.navigate(YieldStackRoutes.YieldWithdrawReview, {
            ...route.params,
            withdrawFlowType: flowType,
        });
    }, [
        account?.symbol,
        analytics,
        dispatch,
        flowType,
        flowKey,
        isWithdrawDisabled,
        isWithdrawReviewReady,
        navigation,
        preparedAction,
        route.params,
        vault,
    ]);

    const handleOpenInfoBottomSheet = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'in-a-nutshell-process-tab',
                value: 'withdraw',
                networkSymbol: account?.symbol,
                vaultId: vault?.id,
            },
        });
        openInfoBottomSheet();
    }, [account?.symbol, analytics, openInfoBottomSheet, vault?.id]);

    if (resolutionStatus !== 'resolved' || !activeInputToken) {
        return null;
    }

    const underlyingTokenSymbol = toTokenSymbol(flowData.token.symbol.toUpperCase());
    const vaultTokenSymbol = toTokenSymbol(flowData.receiptToken.symbol.toUpperCase());

    const activeUnitSymbol = toTokenSymbol(activeInputToken.symbol.toUpperCase());
    const activeUnitTokenContract = activeInputToken.contractAddress
        ? toTokenAddress(activeInputToken.contractAddress)
        : undefined;

    const vaultTokenContract = vault.outputToken?.address
        ? toTokenAddress(vault.outputToken.address)
        : undefined;
    const headerTokenContract = vault.token.address
        ? toTokenAddress(vault.token.address)
        : route.params.tokenContract;
    const accountLabel = account.accountLabel ?? getNetwork(account.symbol).name;
    const depositedAmountLabel = maxAmount
        ? CryptoAmountFormatter.format(maxAmount, {
              symbol: activeUnitSymbol,
              isBalance: true,
              withSymbol: true,
              isEllipsisAppended: false,
              maxDisplayedDecimals: 8,
          })
        : null;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={handleClose}
                    onInfoPress={handleOpenInfoBottomSheet}
                    tokenContract={headerTokenContract}
                    vaultName={vaultTokenName}
                />
            }
            footer={
                <>
                    <ScreenFooterGradient />
                    <Box style={applyStyle(screenFooterStyle)}>
                        <Button isDisabled={isSubmitDisabled} onPress={handleContinue}>
                            <Translation id="generic.buttons.continue" />
                        </Button>
                    </Box>
                </>
            }
        >
            <VStack
                spacing="sp16"
                paddingHorizontal="sp16"
                pointerEvents={isWithdrawPending ? 'none' : 'auto'}
            >
                <ContextMessage context={Context.getEarnYield('withdraw')} />
                {isWithdrawDisabled && (
                    <YieldDisabledAlert
                        type="withdraw"
                        content={withdrawDisabledContent}
                        variant={withdrawDisabledVariant}
                    />
                )}
                <Card style={applyStyle(withdrawFormCardStyle)}>
                    <VStack spacing="sp12">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text variant="body-sm">
                                <Translation id="earn.yieldWithdrawFlowScreen.withdrawalAmount" />
                            </Text>
                            <HStack spacing="sp8" alignItems="center">
                                <Text variant="body-sm">
                                    <Translation id="earn.yieldWithdrawFlowScreen.withdrawMax" />
                                </Text>
                                <Switch isChecked={isMaxSelected} onChange={handleMaxChange} />
                            </HStack>
                        </HStack>

                        <AnimatedDoubleInput
                            activeView={isSharesInput ? 'secondary' : 'primary'}
                            onInputSwitch={handleInputSwitch}
                            renderPrimary={({ inputRef, isDisabled, onPress }) => (
                                <Input
                                    ref={inputRef}
                                    labelType="noLabel"
                                    value={assetAmount}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    editable={!isMaxSelected && !isDisabled}
                                    onChangeText={handleAmountChange}
                                    onPress={onPress}
                                    hasError={!isDisabled && !!amountValidationError}
                                    accessibilityLabel={translate(
                                        'earn.yieldWithdrawFlowScreen.amountToWithdraw',
                                    )}
                                    rightIcon={
                                        <Text
                                            color={
                                                isDisabled ? 'contentSecondary' : 'contentPrimary'
                                            }
                                            numberOfLines={1}
                                        >
                                            {underlyingTokenSymbol}
                                        </Text>
                                    }
                                />
                            )}
                            renderSecondary={({ inputRef, isDisabled, onPress }) => (
                                <Input
                                    ref={inputRef}
                                    labelType="noLabel"
                                    value={sharesAmount}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    editable={!isMaxSelected && !isDisabled}
                                    onChangeText={handleAmountChange}
                                    onPress={onPress}
                                    style={applyStyle(withdrawOutputAmountInputStyle)}
                                    hasError={!isDisabled && !!amountValidationError}
                                    accessibilityLabel={translate(
                                        'earn.yieldWithdrawFlowScreen.amountToWithdraw',
                                    )}
                                    rightIcon={
                                        <Text
                                            color={
                                                isDisabled ? 'contentSecondary' : 'contentPrimary'
                                            }
                                            numberOfLines={1}
                                        >
                                            {vaultTokenSymbol}
                                        </Text>
                                    }
                                />
                            )}
                        />
                        {amountValidationError && (
                            <Hint variant="error">
                                <Translation id={amountValidationError} />
                            </Hint>
                        )}

                        {depositedAmountLabel && (
                            <HStack spacing="sp4" alignItems="center">
                                <Text variant="body-sm" color="contentSecondary">
                                    <Translation id="earn.yieldWithdrawFlowScreen.deposited" />
                                </Text>
                                <Text variant="body-sm" color="contentSecondary">
                                    {depositedAmountLabel}
                                </Text>
                            </HStack>
                        )}
                    </VStack>
                </Card>

                {hasFeeEstimationError && (
                    <YieldFeeEstimationErrorAlert onRetry={retryFeeEstimation} />
                )}

                {isWithdrawReviewReady && (
                    <FeeSelector
                        accountKey={account.key}
                        tokenContract={route.params.tokenContract}
                        updateThunk={updateWithdrawFeeLevelThunk}
                        selectedFee={selectedWithdrawFee}
                        selectedFeePerUnit={withdrawFeeFormDraft.feePerUnit}
                        formDraft={withdrawFeeFormDraft}
                        formDraftKey={withdrawFeeFormDraftKey}
                    />
                )}

                <YieldWithdrawWarning
                    isAmountTooHigh={!amountValidationError && isAmountTooHigh}
                    isMaxWithdrawInfoVisible={isMaxWithdrawInfoVisible}
                    shouldShowNetworkFeeWarning={
                        !amountValidationError && shouldShowNetworkFeeWarning
                    }
                    vaultTokenSymbol={vaultTokenSymbol}
                />
            </VStack>
            {actionPendingTransaction && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={actionPendingTransaction.amount}
                    amountLabel={<Translation id="earn.yieldWithdrawFlowScreen.amountToWithdraw" />}
                    amountTokenContract={activeUnitTokenContract}
                    amountTokenSymbol={activeUnitSymbol}
                    fee={actionPendingTransaction.fee}
                    isExploreDisabled={!explorerUrl}
                    onExplorePress={openInBlockchain}
                    submittedAt={new Date(actionPendingTransaction.submittedAt ?? 0)}
                    title={<Translation id="earn.yieldWithdrawFlowScreen.withdrawPendingTitle" />}
                    vaultName={vaultTokenName}
                    vaultTokenContract={vaultTokenContract}
                />
            )}

            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                bonusRewardTokenName={bonusRewardTokenName}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={underlyingTokenSymbol}
                vaultTokenSymbol={resolvedVaultTokenSymbol}
                account={account}
                vault={vault}
            />
        </Screen>
    );
};
