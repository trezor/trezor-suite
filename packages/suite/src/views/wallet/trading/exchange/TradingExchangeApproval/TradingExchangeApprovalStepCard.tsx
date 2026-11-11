import { useState } from 'react';

import { type ExchangeTrade } from 'invity-api';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Form } from '@suite/form';
import { openModal } from '@suite/modal';
import { getExchangeApprovalType, tradingExchangeActions } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AllowanceLimitType,
    type AllowanceStepState,
    type AllowanceStepVariant,
} from '@suite-common/wallet-types';
import { formatNetworkAmount, subunitsToUnits } from '@suite-common/wallet-utils';
import { Spinner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { BaseCurrencyValue } from 'src/components/suite';
import { AllowanceLimitModal } from 'src/components/wallet/Allowance/AllowanceLimitModal';
import { AllowanceStepCard } from 'src/components/wallet/Allowance/AllowanceStepCard';
import { type AllowanceStepToken } from 'src/components/wallet/Allowance/AllowanceStepToken';
import { useAllowanceTransaction } from 'src/components/wallet/Allowance/hooks/useAllowanceTransaction';
import { useExchangeApproval } from 'src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

import { TradingExchangeApprovalFeeModal } from './TradingExchangeApprovalFeeModal';
import {
    type AllowanceFeeValues,
    getAllowanceFeeValues,
    setAllowanceFeeValues,
} from './allowanceFeeValues';

const LIMIT_TYPE_ANALYTICS_ACTION = {
    minimal: 'limit-exact',
    unlimited: 'limit-unlimited',
} as const satisfies Record<AllowanceLimitType, 'limit-exact' | 'limit-unlimited'>;

type TradingExchangeApprovalStepCardProps = {
    variant: AllowanceStepVariant;
    state: Exclude<AllowanceStepState, 'done'>;
    step: number;
    totalSteps: number;
    account: Account;
    quote: ExchangeTrade;
    pendingApprovalTxid: string | undefined;
    tokenContractAddress: string;
    spender: string;
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

export const TradingExchangeApprovalStepCard = ({
    variant,
    state,
    step,
    totalSteps,
    account,
    quote,
    pendingApprovalTxid,
    tokenContractAddress,
    spender,
    getCryptoInfo,
}: TradingExchangeApprovalStepCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { device } = useDevice();
    const { confirmApproval, confirmPendingApproval } = useExchangeApproval({ account });
    const { handleClick, disabled: isPreparingApproval } = useAsyncClickHandler();
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);

    const transactionType = variant === 'revoke' ? 'revoke' : 'approve';

    const reportAction = (action: 'continue' | 'limit-exact' | 'limit-unlimited') => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: { type: `${transactionType}-modal`, action, ...getCryptoInfo() },
        });
    };

    const {
        token,
        limitType,
        inputAmount,
        allowanceAmount,
        isComposing,
        isSending,
        composedTransaction,
        canSubmit,
        methods,
        selectLimitType,
        confirmAndSend,
        composeRequest,
    } = useAllowanceTransaction({
        type: transactionType,
        amount: quote.sendStringAmount ?? '0',
        account,
        tokenContractAddress,
        spender,
        onSelectLimitType: nextLimitType =>
            reportAction(LIMIT_TYPE_ANALYTICS_ACTION[nextLimitType]),
        onConfirm: () => reportAction('continue'),
        onSent: txid => {
            dispatch(tradingExchangeActions.setApprovalFlowStepTxid({ step: variant, txid }));
            confirmPendingApproval({
                trade: quote,
                txid,
                approvalType: getExchangeApprovalType(variant, limitType),
            });
        },
    });

    const approvalType = getExchangeApprovalType(variant, limitType);

    if (!token?.symbol) {
        return null;
    }

    const stepToken: AllowanceStepToken = {
        networkSymbol: account.symbol,
        contractAddress: token.contract,
        symbol: getDisplaySymbol(token.symbol, token.contract),
        decimals: token.decimals,
    };
    const limitAmount =
        variant === 'revoke'
            ? (quote.preapprovedStringAmount ?? '0')
            : subunitsToUnits({ value: inputAmount, decimals: token.decimals }).toString();
    const txid = quote.approvalSendTxHash ?? pendingApprovalTxid;

    const prepareApprovalAndSend = async () => {
        if (!quote.receiveAddress) {
            return;
        }

        const response = await confirmApproval({
            trade: {
                ...quote,
                status: 'APPROVAL_REQ',
                approvalType,
                approvalSendTxHash: undefined,
            },
            receiveAddress: quote.receiveAddress,
        }).catch(error => {
            console.error('Failed to prepare approval:', error);

            return undefined;
        });

        if (response?.status === 'APPROVAL_REQ') {
            await confirmAndSend();
        }
    };

    const onSelectLimitType = (nextLimitType: AllowanceLimitType) => {
        selectLimitType(nextLimitType);
        setIsLimitModalOpen(false);
    };

    const onConfirmFee = (feeValues: AllowanceFeeValues) => {
        setAllowanceFeeValues(methods, feeValues);
        composeRequest();
    };

    const onTxidClick = () => {
        if (!txid) {
            return;
        }

        dispatch(
            openModal({
                type: 'transaction-detail',
                txid,
                descriptor: account.descriptor,
                symbol: account.symbol,
                deviceState: account.deviceState,
                flow: 'detail',
            }),
        );
    };

    return (
        <Form form={methods} formState={methods.formState}>
            <AllowanceStepCard
                variant={variant}
                state={state}
                step={step}
                totalSteps={totalSteps}
                token={stepToken}
                limitType={limitType}
                limitAmount={limitAmount}
                currentLimitAmount={quote.preapprovedStringAmount}
                onEditLimit={variant === 'revoke' ? undefined : () => setIsLimitModalOpen(true)}
                networkFee={
                    isComposing || !composedTransaction ? (
                        <Spinner size={16} isDisabled />
                    ) : (
                        <BaseCurrencyValue
                            disableHiddenPlaceholder
                            amount={formatNetworkAmount(composedTransaction.fee, account.symbol)}
                            symbol={account.symbol}
                            rateType="current"
                            showApproximationIndicator
                        />
                    )
                }
                onEditFee={() => setIsFeeModalOpen(true)}
                txid={txid}
                onTxidClick={onTxidClick}
                isContinueDisabled={!device?.connected || !canSubmit}
                isContinueLoading={isComposing || isSending || isPreparingApproval}
                onContinue={
                    variant === 'revoke'
                        ? confirmAndSend
                        : () => handleClick(prepareApprovalAndSend)
                }
                data-testid={`@approval-step/${variant}`}
            />
            {isLimitModalOpen && (
                <AllowanceLimitModal
                    limitType={limitType}
                    amount={limitAmount}
                    token={stepToken}
                    onSelect={onSelectLimitType}
                    onClose={() => setIsLimitModalOpen(false)}
                />
            )}
            {isFeeModalOpen && (
                <TradingExchangeApprovalFeeModal
                    account={account}
                    token={token}
                    tokenContractAddress={tokenContractAddress}
                    spender={spender}
                    allowanceAmount={allowanceAmount}
                    defaultFeeValues={getAllowanceFeeValues(methods)}
                    onConfirm={onConfirmFee}
                    onClose={() => setIsFeeModalOpen(false)}
                />
            )}
        </Form>
    );
};
