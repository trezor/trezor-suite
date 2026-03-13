import { useState } from 'react';

import styled, { type DefaultTheme, keyframes } from 'styled-components';

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
import { Banner, Button, Column, Icon, Link, Paragraph, Row } from '@trezor/components';

import { Address } from 'src/components/suite/Address';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { useAnalytics } from 'src/support/useAnalytics';

const TextButton = styled.div<{ $disabled: boolean }>`
    color: ${({ theme, $disabled }) =>
        $disabled ? theme.textDisabled : theme['textPrimaryDefault' as keyof DefaultTheme]};
    cursor: pointer;

    &:hover {
        color: ${({ theme, $disabled }) =>
            $disabled ? theme.textDisabled : theme['textPrimaryPressed' as keyof DefaultTheme]};
    }
`;

const loadingAnimation = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

const IconWrapper = styled.div`
    background-color: inherit;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateY(2px);

    animation: ${loadingAnimation} 1s linear infinite;
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
        preselectedQuote,
        isScheduledQuotesRefresh,
        form: {
            state: { isFormLoading },
        },
        account,
    } = context;

    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const [isApproveButtonLoading, setIsApproveButtonLoading] = useState(false);
    const [isRevokeButtonLoading, setIsRevokeButtonLoading] = useState(false);
    const [isSwapButtonLoading, setIsSwapButtonLoading] = useState(false);
    const [isRefreshButtonLoading, setIsRefreshButtonLoading] = useState(false);

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
        setIsApproveButtonLoading(true);

        await approveTransaction(selectedQuote);

        setIsApproveButtonLoading(false);
        context.setIsApproval(true);
        allowanceState.openApproveModal();
    };

    const onRevokeApprovalClick = async () => {
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
        setIsRevokeButtonLoading(true);

        await revokeApproval(selectedQuote);

        setIsRevokeButtonLoading(false);
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

        setIsSwapButtonLoading(true);

        const newTrade = await confirmApproval({
            trade: { ...selectedQuote, status: 'CONFIRM', approvalType: undefined },
            receiveAddress: selectedQuote.receiveAddress,
        });

        setIsSwapButtonLoading(false);

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

        setIsRefreshButtonLoading(true);

        resetSelectedOffer();
        await refreshQuotes();

        setIsRefreshButtonLoading(false);
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
                                        onClick={onRevokeApprovalClick}
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
                                        onClick={onApproveTransactionClick}
                                        intent="brand"
                                        size="large"
                                        width="100%"
                                        isLoading={
                                            isApproveButtonLoading ||
                                            isRevokeButtonLoading ||
                                            (preselectedQuote && isFormLoading)
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
                                                : onRevokeApprovalClick()
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
                            onClick={onApproveTransactionClick}
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
                        onClick={onProceedToSwapClick}
                        intent="brand"
                        size="large"
                        width="100%"
                        isLoading={
                            isSwapButtonLoading ||
                            isRevokeButtonLoading ||
                            (preselectedQuote && isFormLoading)
                        }
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
                                : onRevokeApprovalClick()
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
                    onClick={onRefreshClick}
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
                <Column width="100%" alignItems="flex-start">
                    <Row alignItems="flex-start" gap={12}>
                        <IconWrapper>
                            <Icon name="spinnerGap" size={20} />
                        </IconWrapper>

                        <Column>
                            <Paragraph
                                typographyStyle="body-md"
                                intent="neutral"
                                priority="secondary"
                                align="start"
                            >
                                <Translation
                                    id={
                                        allowanceState.approvalType === 'APPROVE'
                                            ? 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL'
                                            : 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL'
                                    }
                                />
                            </Paragraph>

                            <Paragraph
                                typographyStyle="body-md"
                                intent="neutral"
                                priority="secondary"
                                align="start"
                            >
                                <Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />
                            </Paragraph>

                            {tx.approvalTxid && (
                                <Link
                                    onClick={() => {
                                        const txid = tx.approvalTxid;
                                        if (txid) {
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
                                        }
                                    }}
                                >
                                    <Address
                                        isTruncated
                                        value={tx.approvalTxid}
                                        intent="brand"
                                        typographyStyle="body-md"
                                    />
                                </Link>
                            )}
                        </Column>
                    </Row>
                </Column>
            )}
        </Column>
    );
};
