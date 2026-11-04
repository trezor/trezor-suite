import { useState } from 'react';

import { type DexApprovalType, type ExchangeTrade } from 'invity-api';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Form } from '@suite/form';
import { openModal } from '@suite/modal';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AllowanceLimitType,
    type AllowanceStepState,
    type AllowanceStepVariant,
} from '@suite-common/wallet-types';
import { formatNetworkAmount, subunitsToUnits } from '@suite-common/wallet-utils';
import { Modal, Spinner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { BaseCurrencyValue } from 'src/components/suite';
import { AllowanceFees } from 'src/components/wallet/Allowance/AllowanceFees';
import { AllowanceLimitModal } from 'src/components/wallet/Allowance/AllowanceLimitModal';
import { AllowanceStepCard } from 'src/components/wallet/Allowance/AllowanceStepCard';
import { type AllowanceStepToken } from 'src/components/wallet/Allowance/AllowanceStepToken';
import { useAllowanceTransaction } from 'src/components/wallet/Allowance/hooks/useAllowanceTransaction';
import { useExchangeApproval } from 'src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

const LIMIT_TYPE_ANALYTICS_ACTION = {
    minimal: 'limit-exact',
    unlimited: 'limit-unlimited',
} as const satisfies Record<AllowanceLimitType, 'limit-exact' | 'limit-unlimited'>;

const getSentApprovalType = (
    variant: AllowanceStepVariant,
    quote: ExchangeTrade,
): DexApprovalType | undefined => {
    if (variant === 'revoke') {
        return 'ZERO';
    }

    return quote.approvalType === 'ZERO' ? 'MINIMAL' : quote.approvalType;
};

type TradingExchangeApprovalStepCardProps = {
    variant: AllowanceStepVariant;
    state: Exclude<AllowanceStepState, 'done'>;
    step: number;
    totalSteps: number;
    account: Account;
    quote: ExchangeTrade;
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
    tokenContractAddress,
    spender,
    getCryptoInfo,
}: TradingExchangeApprovalStepCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { device } = useDevice();
    const { confirmPendingApproval } = useExchangeApproval({ account });
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
        isComposing,
        isSending,
        feeInfo,
        composedLevels,
        composedTransaction,
        composedLevelsError,
        canSubmit,
        methods,
        selectLimitType,
        confirmAndSend,
        handleFeeChange,
    } = useAllowanceTransaction({
        type: transactionType,
        amount: quote.sendStringAmount ?? '0',
        account,
        tokenContractAddress,
        spender,
        onSelectLimitType: nextLimitType =>
            reportAction(LIMIT_TYPE_ANALYTICS_ACTION[nextLimitType]),
        onConfirm: () => reportAction('continue'),
        onSent: txid =>
            confirmPendingApproval({
                trade: quote,
                txid,
                approvalType: getSentApprovalType(variant, quote),
            }),
    });

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
    const txid = quote.approvalSendTxHash;

    const onSelectLimitType = (nextLimitType: AllowanceLimitType) => {
        selectLimitType(nextLimitType);
        setIsLimitModalOpen(false);
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
                isContinueLoading={isComposing || isSending}
                onContinue={confirmAndSend}
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
                <Modal onCancel={() => setIsFeeModalOpen(false)} isBackdropCancelable width={480}>
                    <AllowanceFees
                        account={account}
                        feeInfo={feeInfo}
                        composedLevels={composedLevels}
                        onFeeLevelChange={handleFeeChange}
                        error={composedLevelsError}
                    />
                </Modal>
            )}
        </Form>
    );
};
