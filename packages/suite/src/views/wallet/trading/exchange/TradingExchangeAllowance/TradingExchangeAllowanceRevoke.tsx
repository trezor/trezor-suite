import { useState } from 'react';

import { Address } from '@suite/address';
import { useDevice } from '@suite/device';
import { Form } from '@suite/form';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { REVOKE_ALLOWANCE_AMOUNT } from '@suite-common/wallet-core';
import { type Account, type FeeLevelLabel } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Button, Column, Row, Spinner, Text, TextButton } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { PencilSimpleIcon } from '@trezor/icons';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from '#src/components/suite';
import { type AllowanceStepToken } from '#src/components/wallet/Allowance/AllowanceStepToken';
import { useAllowanceTransaction } from '#src/components/wallet/Allowance/hooks/useAllowanceTransaction';
import { TradingExchangeApprovalFeeModal } from '#src/views/wallet/trading/exchange/TradingExchangeApproval/TradingExchangeApprovalFeeModal';
import {
    type AllowanceFeeValues,
    getAllowanceFeeValues,
    setAllowanceFeeValues,
} from '#src/views/wallet/trading/exchange/TradingExchangeApproval/allowanceFeeValues';

type TradingExchangeAllowanceRevokeProps = {
    account: Account;
    token: AllowanceStepToken;
    spender: string;
    canRevoke: boolean;
    isFirstReadRunning: boolean;
    revokeTxid: string | null;
    onReportAction: (
        action: 'continue' | 'fee-change',
        selectedFee: FeeLevelLabel | undefined,
    ) => void;
    onRevokeSent: (txid: string) => void;
    onContinueSwap: () => Promise<void>;
};

export const TradingExchangeAllowanceRevoke = ({
    account,
    token,
    spender,
    canRevoke,
    isFirstReadRunning,
    revokeTxid,
    onReportAction,
    onRevokeSent,
    onContinueSwap,
}: TradingExchangeAllowanceRevokeProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { device } = useDevice();
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const { handleClick: handleContinueSwapClick, disabled: isContinueSwapPending } =
        useAsyncClickHandler();

    const {
        token: accountToken,
        allowanceAmount,
        isComposing,
        isSending,
        composedTransaction,
        canSubmit,
        selectedFee,
        methods,
        composeRequest,
        confirmAndSend,
    } = useAllowanceTransaction({
        type: 'revoke',
        amount: REVOKE_ALLOWANCE_AMOUNT,
        account,
        tokenContractAddress: token.contractAddress,
        spender,
        shouldShowApprovalToast: false,
        onConfirm: (_limitType, feeLevel) => onReportAction('continue', feeLevel),
        onSent: onRevokeSent,
    });

    const isRevokePending = revokeTxid !== null;
    const hasAllowance = !isFirstReadRunning && canRevoke;

    const onConfirmFee = (feeValues: AllowanceFeeValues) => {
        setAllowanceFeeValues(methods, feeValues);

        if (feeValues.selectedFee !== selectedFee) {
            onReportAction('fee-change', feeValues.selectedFee);
        }

        composeRequest();
    };

    const openTransactionDetail = () => {
        if (!revokeTxid) {
            return;
        }

        dispatch(
            openModal({
                type: 'transaction-detail',
                txid: revokeTxid,
                descriptor: account.descriptor,
                symbol: account.symbol,
                deviceState: account.deviceState,
                flow: 'detail',
            }),
        );
    };

    const revokeButton = (
        <Button
            onClick={confirmAndSend}
            intent={isRevokePending ? 'brand' : 'neutral'}
            priority={isRevokePending ? 'primary' : 'secondary'}
            size="large"
            width="100%"
            isDisabled={isRevokePending || !device?.connected || !canSubmit}
            isLoading={isRevokePending || isSending}
            data-testid="@trading/allowance/revoke-button"
        >
            <Translation
                id={
                    isRevokePending
                        ? 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL'
                        : 'TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON'
                }
            />
        </Button>
    );

    const continueSwapButton = (
        <Button
            onClick={() => handleContinueSwapClick(onContinueSwap)}
            intent="brand"
            size="large"
            width="100%"
            isDisabled={isRevokePending || isContinueSwapPending}
            isLoading={isContinueSwapPending}
            data-testid="@trading/allowance/continue-swap-button"
        >
            <Translation id="TR_EXCHANGE_ALLOWANCE_CONTINUE_SWAP" />
        </Button>
    );

    return (
        <Form form={methods} formState={methods.formState}>
            <Column gap={8}>
                {isRevokePending ? (
                    revokeButton
                ) : (
                    <>
                        {continueSwapButton}
                        {hasAllowance && revokeButton}
                    </>
                )}
                {hasAllowance && !isRevokePending && (
                    <Row justifyContent="center" gap={4} margin={{ top: 4 }}>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_NETWORK_FEE" />
                        </Text>
                        {isComposing || !composedTransaction ? (
                            <Spinner size={16} isDisabled />
                        ) : (
                            <TextButton
                                onClick={() => setIsFeeModalOpen(true)}
                                size="small"
                                iconRight={PencilSimpleIcon}
                                intent="brand"
                                isUnderlined
                                data-testid="@trading/allowance/fee"
                            >
                                <BaseCurrencyValue
                                    disableHiddenPlaceholder
                                    amount={subunitsToUnits({
                                        value: asAmountSubunit(
                                            new BigNumber(composedTransaction.fee),
                                        ),
                                        symbol: account.symbol,
                                    }).toString()}
                                    symbol={account.symbol}
                                    rateType="current"
                                    showApproximationIndicator
                                />
                            </TextButton>
                        )}
                    </Row>
                )}
                {revokeTxid !== null && (
                    <Row justifyContent="center" gap={4} margin={{ top: 4 }}>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_TRADING_DETAIL_TRANSACTION_ID" />
                        </Text>
                        <TextButton
                            onClick={openTransactionDetail}
                            size="small"
                            intent="brand"
                            data-testid="@trading/allowance/txid"
                        >
                            <Address
                                isTruncated
                                isChunked={false}
                                isUnderlined
                                value={revokeTxid}
                                data-testid="@trading/allowance/txid-value"
                            />
                        </TextButton>
                    </Row>
                )}
            </Column>

            {isFeeModalOpen && accountToken && (
                <TradingExchangeApprovalFeeModal
                    account={account}
                    token={accountToken}
                    tokenContractAddress={token.contractAddress}
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
