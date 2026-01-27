import { useEffect, useState } from 'react';
import { usePrevious } from 'react-use';

import styled, { DefaultTheme, keyframes } from 'styled-components';

import { EventType } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    TradingExchangeType,
    tokenSupportsIncreasingAllowance,
    useTradingUtils,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Banner, Button, Column, Icon, Link, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { Address } from 'src/components/suite/Address';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { useTradingExchangeWatchApproval } from 'src/hooks/wallet/trading/form/useTradingExchangeWatchApproval';
import { useAnalytics } from 'src/support/useAnalytics';
import { TradingExchangeApprovalType } from 'src/types/trading/tradingForm';

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

type ApprovalStep = 'REQUIRED' | 'APPROVED' | 'LOADING' | 'ERROR';

interface TradingFormApprovalProps {
    openApproveModal: () => void;
    openRevokeModal: () => void;
    isWaitingForDevice: boolean;
    approvalType: TradingExchangeApprovalType;
    setApprovalType: (approvalType: TradingExchangeApprovalType) => void;
    isManuallyApproved: boolean;
    setIsManuallyApproved: (value: boolean) => void;
}

export const TradingFormApproval = ({
    openApproveModal,
    openRevokeModal,
    isWaitingForDevice,
    approvalType,
    setApprovalType,
    setIsManuallyApproved,
}: TradingFormApprovalProps) => {
    const context = useTradingFormContext<TradingExchangeType>();
    const dispatch = useDispatch();
    const analytics = useAnalytics();

    const {
        selectQuote,
        approveTransaction,
        revokeApproval,
        watchApproval,
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

    const currentQuoteStatus = selectedQuote?.status;
    const previousQuoteStatus = usePrevious(currentQuoteStatus);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const [isApproveButtonLoading, setIsApproveButtonLoading] = useState(false);
    const [isRevokeButtonLoading, setIsRevokeButtonLoading] = useState(false);
    const [isSwapButtonLoading, setIsSwapButtonLoading] = useState(false);
    const [isRefreshButtonLoading, setIsRefreshButtonLoading] = useState(false);

    const [approvalStep, setApprovalStep] = useState<ApprovalStep>();

    useTradingExchangeWatchApproval({
        selectedQuote,
        watchApproval,
    });

    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    useEffect(() => {
        if (currentQuoteStatus === 'ERROR') {
            return setApprovalStep('ERROR');
        }

        if (previousQuoteStatus === undefined || previousQuoteStatus === 'ERROR') {
            if (currentQuoteStatus === 'APPROVAL_REQ') {
                return setApprovalStep('REQUIRED');
            }

            if (currentQuoteStatus === 'CONFIRM') {
                return setApprovalStep('APPROVED');
            }

            if (currentQuoteStatus === 'SIGN_DATA') {
                return setApprovalStep('APPROVED');
            }

            if (currentQuoteStatus === 'APPROVAL_PENDING') {
                return setApprovalStep('LOADING');
            }
        }

        if (previousQuoteStatus === 'APPROVAL_REQ' && currentQuoteStatus === 'CONFIRM') {
            return setApprovalStep('APPROVED');
        }

        if (previousQuoteStatus === 'CONFIRM' && currentQuoteStatus === 'APPROVAL_REQ') {
            return setApprovalStep('REQUIRED');
        }

        if (previousQuoteStatus === 'APPROVAL_REQ' && currentQuoteStatus === 'APPROVAL_PENDING') {
            return setApprovalStep('LOADING');
        }

        if (previousQuoteStatus === 'CONFIRM' && currentQuoteStatus === 'APPROVAL_PENDING') {
            return setApprovalStep('LOADING');
        }

        if (
            previousQuoteStatus === 'APPROVAL_PENDING' &&
            currentQuoteStatus !== 'APPROVAL_PENDING'
        ) {
            refreshQuotes();
        }

        if (previousQuoteStatus === 'APPROVAL_PENDING' && currentQuoteStatus === 'CONFIRM') {
            setIsManuallyApproved(true);

            if (approvalType === 'REVOKE') {
                return setApprovalStep('REQUIRED');
            }

            if (approvalType === 'APPROVE') {
                return setApprovalStep('APPROVED');
            }
        }

        if (previousQuoteStatus === 'APPROVAL_PENDING' && currentQuoteStatus === 'SIGN_DATA') {
            if (approvalType === 'REVOKE') {
                return setApprovalStep('REQUIRED');
            }

            if (approvalType === 'APPROVE') {
                return setApprovalStep('APPROVED');
            }
        }
    }, [
        currentQuoteStatus,
        previousQuoteStatus,
        approvalType,
        refreshQuotes,
        setIsManuallyApproved,
    ]);

    const onApproveTransactionClick = async () => {
        if (!selectedQuote || !selectedQuote.isDex) {
            return;
        }

        analytics.report({
            type: EventType.TradingExchangeApproval,
            payload: {
                type: 'exchange-form',
                action: 'approve',
                ...getCryptoInfo(),
            },
        });

        setApprovalType('APPROVE');
        setIsApproveButtonLoading(true);

        await approveTransaction(selectedQuote);

        setIsApproveButtonLoading(false);
        openApproveModal();
    };

    const onRevokeApprovalClick = async () => {
        if (!selectedQuote || !selectedQuote.receiveAddress) {
            return;
        }

        analytics.report({
            type: EventType.TradingExchangeApproval,
            payload: {
                type: 'exchange-form',
                action: 'revoke',
                ...getCryptoInfo(),
            },
        });

        setApprovalType('REVOKE');
        setIsRevokeButtonLoading(true);

        await revokeApproval(selectedQuote);

        setIsRevokeButtonLoading(false);
        openRevokeModal();
    };

    const onProceedToSwapClick = async () => {
        if (!selectedQuote || !selectedQuote.receiveAddress) {
            return;
        }

        analytics.report({
            type: EventType.TradingExchangeApproval,
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
            type: EventType.TradingExchangeApproval,
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
        (approvalStep === 'LOADING' && approvalType === 'REVOKE') ||
        isFormLoading ||
        isScheduledQuotesRefresh ||
        isDiscoveryRunning ||
        isWaitingForDevice;

    const isSwapButtonDisabled =
        isSwapButtonLoading ||
        (approvalStep === 'LOADING' && approvalType === 'APPROVE') ||
        isFormLoading ||
        isScheduledQuotesRefresh ||
        isDiscoveryRunning ||
        isWaitingForDevice;

    const isRevokeButtonDisabled =
        isRevokeButtonLoading ||
        (approvalStep === 'LOADING' && approvalType === 'APPROVE') ||
        isFormLoading ||
        isScheduledQuotesRefresh ||
        isDiscoveryRunning ||
        isWaitingForDevice;

    const isRefreshButtonDisabled =
        isRefreshButtonLoading || isFormLoading || isScheduledQuotesRefresh || isDiscoveryRunning;

    const isApprovalTxPreApproved =
        selectedQuote?.preapprovedStringAmount && selectedQuote.preapprovedStringAmount !== '0';

    const { contractAddress } = cryptoIdToSymbolAndContractAddress(selectedQuote?.send);
    const isIncreasingAllowanceSupported = tokenSupportsIncreasingAllowance(contractAddress);

    return (
        <Column gap={spacings.md} alignItems="center">
            {approvalStep === 'REQUIRED' && (
                <>
                    {isApprovalTxPreApproved ? (
                        <>
                            {!isIncreasingAllowanceSupported ? (
                                <>
                                    <Button
                                        onClick={onRevokeApprovalClick}
                                        intent="brand"
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
                <Button intent="brand" width="100%" isDisabled={true}>
                    <Translation id="TR_TRADING_SWAP" />
                </Button>
            )}

            {(!approvalStep || approvalStep === 'ERROR') && (
                <Button
                    onClick={onRefreshClick}
                    intent="brand"
                    width="100%"
                    isLoading={isRefreshButtonLoading}
                    isDisabled={isRefreshButtonDisabled}
                >
                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_REFRESH_BUTTON" />
                </Button>
            )}

            {approvalStep === 'LOADING' && (
                <Column width="100%" alignItems="flex-start">
                    <Row alignItems="flex-start" gap={spacings.sm}>
                        <IconWrapper>
                            <Icon name="spinnerGap" size="mediumLarge" />
                        </IconWrapper>

                        <Column>
                            <Paragraph typographyStyle="body" variant="tertiary" align="start">
                                <Translation
                                    id={
                                        approvalType === 'APPROVE'
                                            ? 'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL'
                                            : 'TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL'
                                    }
                                />
                            </Paragraph>

                            <Paragraph typographyStyle="body" variant="tertiary" align="start">
                                <Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />
                            </Paragraph>

                            {selectedQuote?.approvalSendTxHash && (
                                <Link
                                    onClick={() =>
                                        dispatch(
                                            openModal({
                                                type: 'transaction-detail',
                                                txid: selectedQuote.approvalSendTxHash ?? '',
                                                descriptor: account.descriptor,
                                                symbol: account.symbol,
                                                deviceState: account.deviceState,
                                                flow: 'detail',
                                            }),
                                        )
                                    }
                                >
                                    <Address
                                        isTruncated
                                        value={selectedQuote.approvalSendTxHash}
                                        variant="primary"
                                        typographyStyle="body"
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
