import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type YieldWithdrawFlowType,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getWithdrawRequestAmount,
    getYieldWithdrawInputToken,
    splitYieldPendingTransaction,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import {
    AnimatedDoubleInput,
    Box,
    Button,
    Card,
    HStack,
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
import { YieldPendingTransactionModal } from '../components/YieldPendingTransactionModal';
import { YieldWithdrawWarning } from '../components/YieldWithdrawWarning';
import { useResolvedYieldFlowData } from '../hooks/useResolvedYieldFlowData';
import { useShowYieldTransactionFailureAlert } from '../hooks/useShowYieldTransactionFailureAlert';
import { useYieldPendingTransactionTracking } from '../hooks/useYieldPendingTransactionTracking';
import { useYieldSession } from '../hooks/useYieldSession';
import { useYieldWithdrawFees } from '../hooks/useYieldWithdrawFees';

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

    const [assetAmount, setAssetAmount] = useState('');
    const [sharesAmount, setSharesAmount] = useState('');
    const [isMaxSelected, setIsMaxSelected] = useState(false);
    const [flowType, setFlowType] = useState<YieldWithdrawFlowType>(
        route.params.withdrawFlowType ?? 'withdraw',
    );
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
        flowData,
        flowKey,
        resolutionStatus,
        depositedSharesAmount: resolvedDepositedSharesAmount,
        vault,
        vaultTokenName,
    } = useResolvedYieldFlowData(route.params);

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
        isComposingWithdrawFee,
        isFeeUnavailable,
        preparedAction,
        selectedFee: selectedWithdrawFee,
        updateFeeLevelThunk: updateWithdrawFeeLevelThunk,
    } = useYieldWithdrawFees({
        amount,
        flowType,
        flowData,
        flowKey,
        isEnabled: resolutionStatus === 'resolved' && !!amount && !isAmountTooHigh,
    });
    const feeFiatConverters = useCryptoFiatConverters({
        symbol: account?.symbol ?? null,
    });
    const amountFiatTokenContract = useMemo(() => {
        if (!flowData) {
            return undefined;
        }

        const inputToken = getYieldWithdrawInputToken({ flowData, flowType });

        return inputToken.contractAddress ? toTokenAddress(inputToken.contractAddress) : undefined;
    }, [flowData, flowType]);

    const amountFiatConverters = useCryptoFiatConverters({
        symbol: account?.symbol ?? null,
        tokenContract: amountFiatTokenContract,
    });

    const shouldShowNetworkFeeWarning = useMemo(() => {
        if (
            !amount ||
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
        !isWithdrawReviewReady ||
        isComposingWithdrawFee ||
        isFeeUnavailable;

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
    });

    useEffect(() => {
        if (!isFocused || !isWithdrawPending) {
            closePendingBottomSheet();

            return;
        }

        openPendingBottomSheet();
    }, [closePendingBottomSheet, isFocused, isWithdrawPending, openPendingBottomSheet]);

    useEffect(() => {
        if (resolutionStatus !== 'resolved' || !flowKey || session?.step !== 'approve') {
            return;
        }

        dispatch(stablecoinYieldActions.skipApprovalStep({ flowType, flowKey }));
    }, [dispatch, flowKey, flowType, resolutionStatus, session?.step]);

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

        setAssetAmount(depositedAmount);
        setSharesAmount(depositedSharesAmount);
    };

    const handleAmountChange = (value: string) => {
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

    const handleInputSwitch = useCallback((activeView: 'primary' | 'secondary') => {
        setFlowType(getYieldWithdrawFlowTypeByInputView(activeView));
    }, []);

    const handleContinue = useCallback(() => {
        if (!flowKey || !isWithdrawReviewReady || !preparedAction) {
            return;
        }

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
        dispatch,
        flowType,
        flowKey,
        isWithdrawReviewReady,
        navigation,
        preparedAction,
        route.params,
    ]);

    if (resolutionStatus !== 'resolved') {
        return null;
    }

    const underlyingTokenSymbol = toTokenSymbol(flowData.token.symbol.toUpperCase());
    const vaultTokenSymbol = toTokenSymbol(flowData.receiptToken.symbol.toUpperCase());

    const activeInputToken = getYieldWithdrawInputToken({ flowData, flowType });
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
                    onInfoPress={openInfoBottomSheet}
                    tokenContract={headerTokenContract}
                    vaultName={vault.metadata.name}
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
                            onInputSwitch={handleInputSwitch}
                            renderPrimary={({ inputRef, isDisabled, onPress }) => (
                                <Input
                                    ref={inputRef}
                                    value={assetAmount}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    editable={!isMaxSelected && !isDisabled}
                                    onChangeText={handleAmountChange}
                                    onPress={onPress}
                                    accessibilityLabel={translate(
                                        'earn.yieldWithdrawFlowScreen.amountToWithdraw',
                                    )}
                                    rightIcon={
                                        <Text
                                            color={
                                                isDisabled ? 'contentSecondary' : 'contentPrimary'
                                            }
                                        >
                                            {underlyingTokenSymbol}
                                        </Text>
                                    }
                                />
                            )}
                            renderSecondary={({ inputRef, isDisabled, onPress }) => (
                                <Input
                                    ref={inputRef}
                                    value={sharesAmount}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    editable={!isMaxSelected && !isDisabled}
                                    onChangeText={handleAmountChange}
                                    onPress={onPress}
                                    accessibilityLabel={translate(
                                        'earn.yieldWithdrawFlowScreen.amountToWithdraw',
                                    )}
                                    rightIcon={
                                        <Text
                                            color={
                                                isDisabled ? 'contentSecondary' : 'contentPrimary'
                                            }
                                        >
                                            {vaultTokenSymbol}
                                        </Text>
                                    }
                                />
                            )}
                        />

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
                    isAmountTooHigh={isAmountTooHigh}
                    shouldShowNetworkFeeWarning={shouldShowNetworkFeeWarning}
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
                    vaultName={vault.metadata.name}
                    vaultTokenContract={vaultTokenContract}
                />
            )}

            <YieldDepositInfoBottomSheet
                ref={infoBottomSheetRef}
                apy={apy}
                onClose={handleCloseInfoBottomSheet}
                tokenSymbol={underlyingTokenSymbol}
                vaultTokenName={vaultTokenName}
            />
        </Screen>
    );
};
