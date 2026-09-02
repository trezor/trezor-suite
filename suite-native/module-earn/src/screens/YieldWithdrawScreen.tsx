import { useCallback, useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { useSelector } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { useDispatch } from '@suite-common/redux-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getWithdrawRequestAmount,
    getYieldVaultContractAddress,
    getYieldWithdrawInputToken,
    splitYieldPendingTransaction,
    yieldActions,
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
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { decimalTransformer } from '@suite-native/helpers';
import { Translation, selectSupportedLanguageLocale, useTranslate } from '@suite-native/intl';
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

import { EarnApproximateFiatAmount } from '../components/EarnApproximateFiatAmount';
import { YieldDepositFlowScreenHeader } from '../components/YieldDepositFlowScreenHeader';
import { YieldDepositInfoBottomSheet } from '../components/YieldDepositInfoBottomSheet';
import { YieldDisabledAlert } from '../components/YieldDisabledAlert';
import { YieldFeeEstimationErrorAlert } from '../components/YieldFeeEstimationErrorAlert';
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldWithdrawStepCard } from '../components/YieldWithdrawStepCard';
import { YieldWithdrawWarning } from '../components/YieldWithdrawWarning';
import {
    AMOUNT_INPUT_MAX_LENGTH,
    AMOUNT_INPUT_UNFOCUSED_OFFSET,
    AMOUNT_INPUT_WRAPPER_HEIGHT,
} from '../constants';
import { useMessageSystemYield } from '../hooks/useMessageSystemYield';
import { useNavigateBackAnalytics } from '../hooks/useNavigateBackAnalytics';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { useYieldFlowData } from '../hooks/useYieldFlowData';
import { useYieldPendingSheet } from '../hooks/useYieldPendingSheet';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { useYieldWithdrawFees } from '../hooks/useYieldWithdrawFees';
import { formatEarnTokenAmount } from '../utils/earnAmountUtils';
import { getYieldTokenContract, isAmountInputValueValid } from '../utils/yieldFiatAmountUtils';
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
    const { translate } = useTranslate();
    const locale = useSelector(selectSupportedLanguageLocale);
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const [assetAmount, setAssetAmount] = useState('');
    const [sharesAmount, setSharesAmount] = useState('');
    const [isMaxWithdrawInfoVisible, setIsMaxWithdrawInfoVisible] = useState(false);
    const [flowType, setFlowType] = useState<YieldWithdrawFlowType>(
        route.params.withdrawFlowType ?? 'withdraw',
    );
    const isSharesInput = flowType === 'redeem';
    const amount = isSharesInput ? sharesAmount : assetAmount;
    const {
        bottomSheetRef: infoBottomSheetRef,
        closeModal: closeInfoBottomSheet,
        openModal: openInfoBottomSheet,
    } = useBottomSheetModal({ isNestedSheet: true });
    const {
        bottomSheetRef: pendingBottomSheetRef,
        closeModal: closePendingBottomSheet,
        openModal: openPendingBottomSheet,
    } = useBottomSheetModal();

    const yieldFlowData = useYieldFlowData(route.params);
    const {
        account,
        apy,
        bonusRewardTokenSymbol,
        flowData,
        flowKey,
        isWrappedNativeVault,
        resolutionStatus,
        depositedAmount,
        depositedSharesAmount,
        vault,
        vaultTokenSymbol: resolvedVaultTokenSymbol,
        vaultTokenName,
        wrappedNativeSymbol,
    } = yieldFlowData;

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

    const isAmountValidationErrorDisplayed = !!amountValidationError;

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
            !isAmountValidationErrorDisplayed,
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
            isAmountValidationErrorDisplayed ||
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
        isAmountValidationErrorDisplayed,
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
        isWrappedNativeVault,
        shouldDisposeOnGoBack: true,
    });
    const pendingTransaction = session?.action.pendingTransaction ?? null;
    const { actionPendingTransaction } = splitYieldPendingTransaction(pendingTransaction, flowType);
    const isWithdrawPending = !!actionPendingTransaction;
    const { displayedPendingTransaction, isSheetPresented, handleSheetDismissed } =
        useYieldPendingSheet(actionPendingTransaction);
    const { explorerUrl, openInBlockchain } = useTransactionDetails({
        accountKey: account?.key ?? null,
        txid: displayedPendingTransaction?.txid ?? null,
    });
    const isSubmitDisabled =
        !amount ||
        isWithdrawPending ||
        isAmountTooHigh ||
        isAmountValidationErrorDisplayed ||
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
        // Replacing the screen while the sheet is still dismissing crashes Fabric — see
        // `useYieldPendingSheet`.
        if (isSheetPresented) {
            return;
        }

        if (session?.step === 'unwrap') {
            navigation.replace(YieldStackRoutes.YieldWithdrawUnwrap, {
                ...route.params,
                withdrawFlowType: flowType,
            });

            return;
        }

        if (session?.step === 'complete') {
            navigation.replace(YieldStackRoutes.YieldWithdrawComplete, {
                ...route.params,
                withdrawFlowType: flowType,
            });
        }
    }, [flowType, isSheetPresented, navigation, route.params, session?.step]);

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

    const handleMaxPress = () => {
        if (!depositedAmount || !depositedSharesAmount) {
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

        // The Max press flips the visible input, so the keyboard must not stay bound to the one
        // that moves to the background.
        Keyboard.dismiss();

        setAssetAmount(depositedAmount);
        setSharesAmount(depositedSharesAmount);

        if (isSharesInput) {
            return;
        }

        // Redeeming the exact shares balance prevents leaving yield dust behind; the banner
        // explains the unit switch until the user edits the amount.
        setFlowType('redeem');
        setIsMaxWithdrawInfoVisible(true);
    };

    const handleAmountChange = (value: string) => {
        if (!flowData) {
            return;
        }

        setIsMaxWithdrawInfoVisible(false);

        const transformedValue = decimalTransformer(value);

        if (!transformedValue) {
            setAssetAmount('');
            setSharesAmount('');

            return;
        }

        const inputDecimals = isSharesInput
            ? vault?.outputToken?.decimals
            : flowData.token.decimals;

        if (
            inputDecimals != null &&
            !isAmountInputValueValid({ value: transformedValue, decimals: inputDecimals })
        ) {
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

            setIsMaxWithdrawInfoVisible(false);
            setFlowType(getYieldWithdrawFlowTypeByInputView(activeView));
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
                wrappedNative: isWrappedNativeVault,
                ...(apyBreakdown && { apyBreakdown }),
            },
        });

        dispatch(yieldActions.discardTransaction());
        dispatch(
            yieldActions.storeActionReviewData({
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
        isWrappedNativeVault,
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

    const underlyingTokenSymbol = toTokenSymbol(flowData.token.symbol);
    const vaultTokenSymbol = toTokenSymbol(flowData.receiptToken.symbol);

    const activeUnitSymbol = toTokenSymbol(activeInputToken.symbol);
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
        ? formatEarnTokenAmount({ amount: maxAmount, locale, symbol: activeUnitSymbol })
        : null;

    return (
        <Screen
            noHorizontalPadding
            header={
                <YieldDepositFlowScreenHeader
                    account={account}
                    closeAction={handleClose}
                    onInfoPress={handleOpenInfoBottomSheet}
                    title={vaultTokenName}
                    tokenContract={headerTokenContract}
                />
            }
            footer={
                <>
                    <ScreenFooterGradient />
                    <Box style={applyStyle(screenFooterStyle)}>
                        <Button
                            isDisabled={isSubmitDisabled}
                            isLoading={isComposingWithdrawFee}
                            onPress={handleContinue}
                        >
                            <Translation id="generic.buttons.continue" />
                        </Button>
                    </Box>
                </>
            }
        >
            <VStack spacing="sp16" pointerEvents={isWithdrawPending ? 'none' : 'auto'}>
                <YieldWithdrawStepCard
                    currentStepId="withdraw"
                    hasUnwrapStep={isWrappedNativeVault}
                    networkSymbol={account.symbol}
                />
                <VStack spacing="sp16" paddingHorizontal="sp16">
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
                            <Text variant="body-sm">
                                <Translation id="earn.yieldWithdrawFlowScreen.withdrawalAmount" />
                            </Text>

                            <AnimatedDoubleInput
                                activeView={isSharesInput ? 'secondary' : 'primary'}
                                onInputSwitch={handleInputSwitch}
                                unfocusedOffset={AMOUNT_INPUT_UNFOCUSED_OFFSET}
                                wrapperHeight={AMOUNT_INPUT_WRAPPER_HEIGHT}
                                renderPrimary={({ inputRef, isDisabled, onPress }) => (
                                    <Input
                                        ref={inputRef}
                                        labelType="noLabel"
                                        value={assetAmount}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        maxLength={AMOUNT_INPUT_MAX_LENGTH}
                                        editable={!isDisabled}
                                        onChangeText={handleAmountChange}
                                        onPress={onPress}
                                        hasError={!isDisabled && isAmountValidationErrorDisplayed}
                                        accessibilityLabel={translate(
                                            'earn.yieldWithdrawFlowScreen.amountToWithdraw',
                                        )}
                                        rightIcon={
                                            <Text
                                                color={
                                                    isDisabled
                                                        ? 'contentSecondary'
                                                        : 'contentPrimary'
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
                                        maxLength={AMOUNT_INPUT_MAX_LENGTH}
                                        editable={!isDisabled}
                                        onChangeText={handleAmountChange}
                                        onPress={onPress}
                                        style={applyStyle(withdrawOutputAmountInputStyle)}
                                        hasError={!isDisabled && isAmountValidationErrorDisplayed}
                                        accessibilityLabel={translate(
                                            'earn.yieldWithdrawFlowScreen.amountToWithdraw',
                                        )}
                                        rightIcon={
                                            <Text
                                                color={
                                                    isDisabled
                                                        ? 'contentSecondary'
                                                        : 'contentPrimary'
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
                                <HStack
                                    spacing="sp8"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <HStack spacing="sp8" alignItems="center" flexShrink={1}>
                                        <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                                            <Text variant="body-sm" color="contentSecondary">
                                                <Translation id="earn.yieldWithdrawFlowScreen.deposited" />
                                            </Text>
                                            <Box flexShrink={1}>
                                                <Text
                                                    variant="body-sm"
                                                    color="contentSecondary"
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    {depositedAmountLabel}
                                                </Text>
                                            </Box>
                                        </HStack>
                                        <Button
                                            size="medium"
                                            intent="neutral"
                                            priority="secondary"
                                            onPress={handleMaxPress}
                                            testID="@yield-withdraw/max-button"
                                        >
                                            <Translation id="earn.yieldWithdrawFlowScreen.maxButton" />
                                        </Button>
                                    </HStack>
                                    <EarnApproximateFiatAmount
                                        amount={assetAmount || (depositedAmount ?? '')}
                                        symbol={account.symbol}
                                        tokenContract={getYieldTokenContract(flowData.token)}
                                    />
                                </HStack>
                            )}
                        </VStack>
                    </Card>

                    {hasFeeEstimationError && (
                        <YieldFeeEstimationErrorAlert onRetry={retryFeeEstimation} />
                    )}

                    {!!withdrawFeeFormDraft && (
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
                        isAmountTooHigh={!isAmountValidationErrorDisplayed && isAmountTooHigh}
                        isMaxWithdrawInfoVisible={isMaxWithdrawInfoVisible}
                        shouldShowNetworkFeeWarning={
                            !isAmountValidationErrorDisplayed && shouldShowNetworkFeeWarning
                        }
                        vaultTokenSymbol={vaultTokenSymbol}
                    />
                </VStack>
            </VStack>
            {displayedPendingTransaction && (
                <YieldPendingTransactionModal
                    ref={pendingBottomSheetRef}
                    accountLabel={accountLabel}
                    accountSymbol={account.symbol}
                    amount={displayedPendingTransaction.amount}
                    amountLabel={<Translation id="earn.yieldWithdrawFlowScreen.amountToWithdraw" />}
                    amountTokenContract={activeUnitTokenContract}
                    amountTokenSymbol={activeUnitSymbol}
                    fee={displayedPendingTransaction.fee}
                    isExploreDisabled={!explorerUrl}
                    onDismiss={handleSheetDismissed}
                    onExplorePress={openInBlockchain}
                    submittedAt={new Date(displayedPendingTransaction.submittedAt ?? 0)}
                    txid={displayedPendingTransaction.txid}
                    title={<Translation id="earn.yieldWithdrawFlowScreen.withdrawPendingTitle" />}
                    vaultName={vaultTokenName}
                    vaultTokenContract={vaultTokenContract}
                />
            )}

            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                bonusRewardTokenSymbol={bonusRewardTokenSymbol}
                onClose={closeInfoBottomSheet}
                tokenSymbol={underlyingTokenSymbol}
                vaultTokenSymbol={resolvedVaultTokenSymbol}
                account={account}
                vault={vault}
                wrappedNativeSymbol={wrappedNativeSymbol}
            />
        </Screen>
    );
};
