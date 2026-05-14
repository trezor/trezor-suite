import styled, { type DefaultTheme } from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    type TradingExchangeType,
    requiresTokenApproval,
    tokenSupportsIncreasingAllowance,
    useApprovalStep,
    useTradingUtils,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Banner, Button, Column } from '@trezor/components';
import { PendingTransactionInfo } from '@trezor/product-components';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { Address } from 'src/components/suite/Address';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { useAnalytics } from 'src/support/useAnalytics';

const TextButton = styled.div<{ $disabled: boolean }>`
    color: ${({ theme, $disabled }) =>
        $disabled ? theme.contentDisabled : theme['contentBrand' as keyof DefaultTheme]};
    cursor: pointer;

    &:hover {
        color: ${({ theme, $disabled }) =>
            $disabled ? theme.contentDisabled : theme['contentBrandPressed' as keyof DefaultTheme]};
    }
`;

export const TradingFormApproval = () => {
    const context = useTradingFormContext<TradingExchangeType>();
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const { tx, state: allowanceState } = useAllowanceContext();

    const {
        selectQuote,
        approveTransaction,
        revokeApproval,
        refreshQuotes,
        confirmApproval,
        resetSelectedOffer,
        selectedQuote,
        isScheduledQuotesRefresh,
        form: {
            state: { isFormLoading },
        },
        account,
    } = context;

    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { handleClick: handleApproveClick, disabled: isApproveButtonLoading } =
        useAsyncClickHandler();
    const { handleClick: handleRevokeClick, disabled: isRevokeButtonLoading } =
        useAsyncClickHandler();
    const { handleClick: handleSwapClick, disabled: isSwapButtonLoading } = useAsyncClickHandler();
    const { handleClick: handleRefreshClick, disabled: isRefreshButtonLoading } =
        useAsyncClickHandler();

    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    const { approvalStep } = useApprovalStep({
        tx,
        currentApprovalType: allowanceState.approvalType,
        quoteStatus: selectedQuote?.status,
        refreshQuotes,
    });

    const onApproveTransactionClick = async () => {
        if (!selectedQuote || !requiresTokenApproval(selectedQuote)) {
            return;
        }

        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'exchange-form',
                action: 'approve',
                ...getCryptoInfo(),
            },
        });

        allowanceState.setApprovalType('APPROVE');

        await approveTransaction(selectedQuote);

        context.setIsApproval(true);
        allowanceState.openApproveModal();
    };

    const onRevokeClick = async () => {
        if (!selectedQuote || !selectedQuote.receiveAddress) {
            return;
        }

        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'exchange-form',
                action: 'revoke',
                ...getCryptoInfo(),
            },
        });

        allowanceState.setApprovalType('REVOKE');

        await revokeApproval(selectedQuote);

        context.setIsApproval(true);
        allowanceState.openRevokeModal();
    };

    const onProceedToSwapClick = async () => {
        if (!selectedQuote || !selectedQuote.receiveAddress) {
            return;
        }

        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'exchange-form',
                action: 'swap',
                ...getCryptoInfo(),
            },
        });

        const newTrade = await confirmApproval({
            trade: { ...selectedQuote, status: 'CONFIRM', approvalType: undefined },
            receiveAddress: selectedQuote.receiveAddress,
        });

        if (!newTrade || newTrade.status === 'ERROR') {
            return;
        }

        selectQuote(selectedQuote);
    };

    const onRefreshClick = async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'exchange-form',
                action: 'refresh',
                ...getCryptoInfo(),
            },
        });

        resetSelectedOffer();
        await refreshQuotes();
    };

    const isApproveButtonDisabled =
        isApproveButtonLoading ||
        (approvalStep === 'LOADING' && allowanceState.approvalType === 'REVOKE') ||
        isFormLoading ||
        isScheduledQuotesRefresh ||
        isDiscoveryRunning ||
        allowanceState.isWaitingForDevice;

    const isSwapButtonDisabled =
        isSwapButtonLoading ||
        (approvalStep === 'LOADING' && allowanceState.approvalType === 'APPROVE') ||
        isFormLoading ||
        isScheduledQuotesRefresh ||
        isDiscoveryRunning ||
        allowanceState.isWaitingForDevice;

    const isRevokeButtonDisabled =
        isRevokeButtonLoading ||
        (approvalStep === 'LOADING' && allowanceState.approvalType === 'APPROVE') ||
        isFormLoading ||
        isScheduledQuotesRefresh ||
        isDiscoveryRunning ||
        allowanceState.isWaitingForDevice;

    const isRefreshButtonDisabled =
        isRefreshButtonLoading || isFormLoading || isScheduledQuotesRefresh || isDiscoveryRunning;

    const isApprovalTxPreApproved =
        selectedQuote?.preapprovedStringAmount && selectedQuote.preapprovedStringAmount !== '0';

    const { contractAddress } = cryptoIdToSymbolAndContractAddress(selectedQuote?.send);
    const isIncreasingAllowanceSupported = tokenSupportsIncreasingAllowance(contractAddress);

    return (
        <Column gap={16} alignItems="center">
            {approvalStep === 'REQUIRED' && (
                <>
                    {isApprovalTxPreApproved ? (
                        <>
                            {!isIncreasingAllowanceSupported ? (
                                <>
                                    <Button
                                        onClick={() => handleRevokeClick(onRevokeClick)}
                                        intent="brand"
                                        size="large"
                                        width="100%"
                                        isLoading={isRevokeButtonLoading}
                                        isDisabled={isRevokeButtonDisabled}
                                    >
                                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                                    </Button>

                                    <Banner
                                        intent="warning"
                                        icon="warning"
                                        description={
                                            <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BANNER" />
                                        }
                                    />
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={() =>
                                            handleApproveClick(onApproveTransactionClick)
                                        }
                                        intent="brand"
                                        size="large"
                                        width="100%"
                                        isLoading={
                                            isApproveButtonLoading ||
                                            isRevokeButtonLoading ||
                                            isFormLoading
                                        }
                                        isDisabled={
                                            isApproveButtonDisabled || isRevokeButtonDisabled
                                        }
                                    >
                                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_INCREASE_BUTTON" />
                                    </Button>

                                    <TextButton
                                        onClick={() =>
                                            isRevokeButtonDisabled ||
                                            isRevokeButtonLoading ||
                                            isApproveButtonDisabled ||
                                            isApproveButtonLoading
                                                ? null
                                                : handleRevokeClick(onRevokeClick)
                                        }
                                        $disabled={
                                            isRevokeButtonDisabled || isApproveButtonDisabled
                                        }
                                    >
                                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                                    </TextButton>
                                </>
                            )}
                        </>
                    ) : (
                        <Button
                            onClick={() => handleApproveClick(onApproveTransactionClick)}
                            intent="brand"
                            size="large"
                            width="100%"
                            isLoading={isApproveButtonLoading}
                            isDisabled={isApproveButtonDisabled}
                        >
                            <Translation id="TR_EXCHANGE_APPROVAL_FORM_APPROVE_BUTTON" />
                        </Button>
                    )}
                </>
            )}

            {approvalStep === 'APPROVED' && (
                <>
                    <Button
                        onClick={() => handleSwapClick(onProceedToSwapClick)}
                        intent="brand"
                        size="large"
                        width="100%"
                        isLoading={isSwapButtonLoading || isRevokeButtonLoading || isFormLoading}
                        isDisabled={isSwapButtonDisabled || isRevokeButtonDisabled}
                    >
                        <Translation id="TR_TRADING_SWAP" />
                    </Button>

                    <TextButton
                        onClick={() =>
                            isRevokeButtonDisabled ||
                            isRevokeButtonLoading ||
                            isSwapButtonDisabled ||
                            isSwapButtonLoading
                                ? null
                                : handleRevokeClick(onRevokeClick)
                        }
                        $disabled={isRevokeButtonDisabled || isSwapButtonDisabled}
                    >
                        <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                    </TextButton>
                </>
            )}

            {approvalStep === 'LOADING' && (
                <Button intent="brand" size="large" width="100%" isDisabled={true}>
                    <Translation id="TR_TRADING_SWAP" />
                </Button>
            )}

            {(!approvalStep || approvalStep === 'ERROR') && (
                <Button
                    onClick={() => handleRefreshClick(onRefreshClick)}
                    intent="brand"
                    size="large"
                    width="100%"
                    isLoading={isRefreshButtonLoading}
                    isDisabled={isRefreshButtonDisabled}
                >
                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_REFRESH_BUTTON" />
                </Button>
            )}

            {approvalStep === 'LOADING' && (
                <PendingTransactionInfo
                    title={
                        <Translation
                            id={
                                allowanceState.approvalType === 'APPROVE'
                                    ? 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL'
                                    : 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL'
                            }
                        />
                    }
                    txidLabel={<Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />}
                    txidComponent={
                        tx.approvalTxid ? (
                            <Address
                                isTruncated
                                value={tx.approvalTxid}
                                intent="brand"
                                typographyStyle="body-md"
                            />
                        ) : (
                            <Translation id="TR_UNKNOWN" />
                        )
                    }
                    onTxClick={
                        tx.approvalTxid
                            ? () =>
                                  dispatch(
                                      openModal({
                                          type: 'transaction-detail',
                                          txid: tx.approvalTxid!,
                                          descriptor: account.descriptor,
                                          symbol: account.symbol,
                                          deviceState: account.deviceState,
                                          flow: 'detail',
                                      }),
                                  )
                            : undefined
                    }
                />
            )}
        </Column>
    );
};
