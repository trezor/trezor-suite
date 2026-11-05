import { useState } from 'react';

import { Address } from '@suite/address';
import { useDevice } from '@suite/device';
import { useExternalLink } from '@suite/external-links';
import { Form } from '@suite/form';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    type ExchangeAllowanceCoverage,
    type ExchangeAllowanceSource,
} from '@suite-common/trading';
import { type Explorer, getExplorerUrl } from '@suite-common/wallet-config';
import { REVOKE_ALLOWANCE_AMOUNT } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Banner, Button, Column, Row, Spinner, Text, TextButton } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { TokenIcon } from '@trezor/product-components';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { BaseCurrencyValue } from 'src/components/suite';
import { AllowanceAmount } from 'src/components/wallet/Allowance/AllowanceAmount';
import { type AllowanceProvider } from 'src/components/wallet/Allowance/AllowanceProviderInfo';
import { AllowanceProviderLogo } from 'src/components/wallet/Allowance/AllowanceProviderLogo';
import { AllowanceStepRow } from 'src/components/wallet/Allowance/AllowanceStepRow';
import { useAllowanceTransaction } from 'src/components/wallet/Allowance/hooks/useAllowanceTransaction';
import { TradingExchangeApprovalFeeModal } from 'src/views/wallet/trading/exchange/TradingExchangeApproval/TradingExchangeApprovalFeeModal';
import {
    type AllowanceFeeValues,
    getAllowanceFeeValues,
    setAllowanceFeeValues,
} from 'src/views/wallet/trading/exchange/TradingExchangeApproval/allowanceFeeValues';

import { TradingExchangeAllowanceAmount } from './TradingExchangeAllowanceAmount';
import { TradingExchangeAllowanceNamedAddress } from './TradingExchangeAllowanceNamedAddress';
import { TradingExchangeAllowanceSourceInfo } from './TradingExchangeAllowanceSourceInfo';
import { type TradingExchangeAllowanceToken } from './useTradingExchangeAllowanceFlow';

type TradingExchangeAllowanceRevokeProps = {
    account: Account;
    token: TradingExchangeAllowanceToken;
    provider: AllowanceProvider;
    spender: string;
    explorer: Explorer | undefined;
    coverage: ExchangeAllowanceCoverage;
    /** Allowance in token units the revoke resets. */
    currentAmount: string;
    currentAmountSource: ExchangeAllowanceSource;
    hasReadFailed: boolean;
    readErrorMessage: string | undefined;
    /** Token units the swap spends. */
    neededAmount: string | undefined;
    isFirstReadRunning: boolean;
    revokeTxid: string | null;
    onRevokeConfirm: () => void;
    onRevokeSent: (txid: string) => void;
    onContinueSwap: () => Promise<void>;
};

export const TradingExchangeAllowanceRevoke = ({
    account,
    token,
    provider,
    spender,
    explorer,
    coverage,
    currentAmount,
    currentAmountSource,
    hasReadFailed,
    readErrorMessage,
    neededAmount,
    isFirstReadRunning,
    revokeTxid,
    onRevokeConfirm,
    onRevokeSent,
    onContinueSwap,
}: TradingExchangeAllowanceRevokeProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { device } = useDevice();
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const { handleClick: handleContinueSwapClick, disabled: isContinueSwapPending } =
        useAsyncClickHandler();

    // Addresses link to the explorer the same way as in the transaction detail.
    const addressExplorerUrl = getExplorerUrl(explorer, 'address');
    const explorerQueryString = explorer?.queryString ?? '';
    const spenderExplorerLink = useExternalLink(
        `${addressExplorerUrl}${spender}${explorerQueryString}`,
    );
    const tokenExplorerLink = useExternalLink(
        `${addressExplorerUrl}${token.contractAddress}${explorerQueryString}`,
    );

    const {
        token: accountToken,
        allowanceAmount,
        isComposing,
        isSending,
        composedTransaction,
        canSubmit,
        methods,
        composeRequest,
        confirmAndSend,
    } = useAllowanceTransaction({
        type: 'revoke',
        amount: REVOKE_ALLOWANCE_AMOUNT,
        account,
        tokenContractAddress: token.contractAddress,
        spender,
        onConfirm: onRevokeConfirm,
        onSent: onRevokeSent,
    });

    const { kind } = coverage;
    const isRevokePending = revokeTxid !== null;
    const hasAllowance = !isFirstReadRunning && kind !== 'none';
    // A reset is the only way forward for a too-low allowance of a token that cannot raise it, and
    // the recommended one for an unlimited allowance.
    const isRevokePrimary = kind === 'unlimited' || (kind === 'too_low' && coverage.requiresReset);
    const showsContinueSwap = !(kind === 'too_low' && coverage.requiresReset);
    const showsNeededRow = (kind === 'unlimited' || kind === 'none') && neededAmount !== undefined;

    const onConfirmFee = (feeValues: AllowanceFeeValues) => {
        setAllowanceFeeValues(methods, feeValues);
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
            intent={isRevokePrimary || isRevokePending ? 'brand' : 'neutral'}
            priority={isRevokePrimary || isRevokePending ? 'primary' : 'secondary'}
            size="large"
            width="100%"
            isDisabled={isRevokePending || !hasAllowance || !device?.connected || !canSubmit}
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
            intent={isRevokePrimary ? 'neutral' : 'brand'}
            priority={isRevokePrimary ? 'secondary' : 'primary'}
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
            <Column gap={16}>
                <Column gap={12}>
                    <AllowanceStepRow
                        label="TR_EXCHANGE_ALLOWANCE_SPENDER"
                        data-testid="@trading/allowance/spender"
                    >
                        <TradingExchangeAllowanceNamedAddress
                            name={provider.companyName ?? provider.name ?? ''}
                            address={spender}
                            explorerLink={spenderExplorerLink}
                            icon={provider.logo && <AllowanceProviderLogo logo={provider.logo} />}
                        />
                    </AllowanceStepRow>
                    <AllowanceStepRow label="TR_TOKEN" data-testid="@trading/allowance/token">
                        <TradingExchangeAllowanceNamedAddress
                            name={token.name ?? token.symbol}
                            address={token.contractAddress}
                            explorerLink={tokenExplorerLink}
                            icon={
                                <TokenIcon
                                    symbol={token.networkSymbol}
                                    contractAddress={token.contractAddress}
                                    size={20}
                                    placeholder={token.symbol}
                                />
                            }
                        />
                    </AllowanceStepRow>
                    <AllowanceStepRow
                        label="TR_EXCHANGE_ALLOWANCE_APPROVED_AMOUNT"
                        data-testid="@trading/allowance/limit"
                    >
                        <Row gap={8}>
                            {kind === 'unlimited' ? (
                                <Text typographyStyle="body-sm-strong" intent="critical">
                                    <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
                                </Text>
                            ) : (
                                // The full amount, so it can be checked against the chain to the unit.
                                <AllowanceAmount
                                    amount={currentAmount}
                                    symbol={token.symbol}
                                    contractAddress={token.contractAddress}
                                    decimals={token.decimals}
                                    typographyStyle="body-sm-strong"
                                    isLoading={isFirstReadRunning}
                                    data-testid="@trading/allowance/current-limit"
                                />
                            )}
                            <TradingExchangeAllowanceSourceInfo
                                source={currentAmountSource}
                                hasReadFailed={hasReadFailed}
                                readErrorMessage={readErrorMessage}
                                data-testid="@trading/allowance/source-info"
                            />
                        </Row>
                    </AllowanceStepRow>
                    {showsNeededRow && (
                        <AllowanceStepRow
                            label="TR_EXCHANGE_ALLOWANCE_NEEDED_FOR_SWAP"
                            data-testid="@trading/allowance/needed"
                        >
                            <TradingExchangeAllowanceAmount amount={neededAmount} token={token} />
                        </AllowanceStepRow>
                    )}
                    {hasAllowance && (
                        <AllowanceStepRow
                            label="TR_EXCHANGE_ALLOWANCE_FEE_TO_REVOKE"
                            onEdit={isRevokePending ? undefined : () => setIsFeeModalOpen(true)}
                            data-testid="@trading/allowance/fee"
                        >
                            {isComposing || !composedTransaction ? (
                                <Spinner size={16} isDisabled />
                            ) : (
                                <BaseCurrencyValue
                                    disableHiddenPlaceholder
                                    amount={formatNetworkAmount(
                                        composedTransaction.fee,
                                        account.symbol,
                                    )}
                                    symbol={account.symbol}
                                    rateType="current"
                                    showApproximationIndicator
                                />
                            )}
                        </AllowanceStepRow>
                    )}
                    {revokeTxid !== null && (
                        <AllowanceStepRow
                            label="TR_TRADING_DETAIL_TRANSACTION_ID"
                            data-testid="@trading/allowance/txid"
                        >
                            <TextButton
                                onClick={openTransactionDetail}
                                size="small"
                                intent="brand"
                                isUnderlined
                            >
                                <Address
                                    isTruncated
                                    isChunked={false}
                                    value={revokeTxid}
                                    data-testid="@trading/allowance/txid-value"
                                />
                            </TextButton>
                        </AllowanceStepRow>
                    )}
                </Column>

                {kind === 'too_low' && neededAmount !== undefined && (
                    <Banner
                        intent="info"
                        icon
                        description={
                            <Translation
                                id={
                                    coverage.requiresReset
                                        ? 'TR_EXCHANGE_ALLOWANCE_HINT_AFTER_REVOKE'
                                        : 'TR_EXCHANGE_ALLOWANCE_HINT_INCREASE'
                                }
                                values={{
                                    needed: (
                                        <TradingExchangeAllowanceAmount
                                            amount={neededAmount}
                                            token={token}
                                        />
                                    ),
                                }}
                            />
                        }
                        data-testid="@trading/allowance/hint"
                    />
                )}
                {kind === 'unlimited' && (
                    <Banner
                        intent="critical"
                        icon
                        description={<Translation id="TR_EXCHANGE_ALLOWANCE_HINT_UNLIMITED" />}
                        data-testid="@trading/allowance/hint"
                    />
                )}

                <Column gap={8}>
                    {/* While the revoke confirms, its button alone shows the progress, like an approval step. */}
                    {isRevokePending && revokeButton}
                    {!isRevokePending && isRevokePrimary && (
                        <>
                            {revokeButton}
                            {showsContinueSwap && continueSwapButton}
                        </>
                    )}
                    {!isRevokePending && !isRevokePrimary && (
                        <>
                            {continueSwapButton}
                            {hasAllowance && revokeButton}
                        </>
                    )}
                </Column>
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
