import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type ExchangeTrade } from 'invity-api';

import { Address } from '@suite/address';
import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    type TradingFormAccountRootState,
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
} from '@suite-common/trading';
import {
    type FeesRootState,
    selectAreFeesLoading,
    selectHasRunningDiscovery,
    useAllowanceTxTracking,
} from '@suite-common/wallet-core';
import { Button, Column, TextButton } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { PendingTransactionInfo } from '@trezor/product-components';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { useExchangeApproval } from '#src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { type GetTradingExchangeCryptoInfo } from '#src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { TradingRevokeModal } from '#src/views/wallet/trading/common/TradingForm/TradingRevokeModal';

type TradingFormApprovalProps = {
    isComposing: boolean;
    isFormInvalid: boolean;
    refreshQuotes: () => Promise<void>;
    onStartApprovalFlow: (quote: ExchangeTrade) => void;
    onSwap: (quote: ExchangeTrade) => void;
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

export const TradingFormApproval = ({
    isComposing,
    isFormInvalid,
    refreshQuotes,
    onStartApprovalFlow,
    onSwap,
    getCryptoInfo,
}: TradingFormApprovalProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const account = useSelector((reduxState: TradingFormAccountRootState) =>
        selectTradingSendAccount(reduxState, 'exchange'),
    );
    const { revokeApproval, confirmApproval } = useExchangeApproval({ account });

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );

    const { handleClick: handleSwapClick, disabled: isSwapButtonLoading } = useAsyncClickHandler();
    const { handleClick: handleRevokeClick, disabled: isRevokeButtonLoading } =
        useAsyncClickHandler();
    const { handleClick: handleRefreshClick, disabled: isRefreshButtonLoading } =
        useAsyncClickHandler();

    const {
        approvalTxid: revokeTxid,
        status: revokeTxStatus,
        setApprovalTxid: setRevokeTxid,
    } = useAllowanceTxTracking({ accountKey: account?.key ?? null });

    useEffect(() => {
        if (revokeTxStatus.isFailed) {
            setRevokeTxid(null);

            return;
        }

        if (!revokeTxStatus.isConfirmed) {
            return;
        }

        refreshQuotes()
            .catch(error => {
                console.error('Failed to refresh quotes after revoke:', error);
            })
            .finally(() => setRevokeTxid(null));
    }, [revokeTxStatus, refreshQuotes, setRevokeTxid]);

    const status = selectedQuote?.status;

    const reportFormAction = (action: 'swap' | 'revoke' | 'refresh') => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: { type: 'exchange-form', action, ...getCryptoInfo() },
        });
    };

    const onContinueClick = () => {
        if (!selectedQuote?.receiveAddress) {
            return;
        }

        reportFormAction('swap');
        onStartApprovalFlow(selectedQuote);
    };

    const onSwapClick = async () => {
        if (!selectedQuote?.receiveAddress) {
            return;
        }

        reportFormAction('swap');

        const newTrade = await confirmApproval({
            trade: { ...selectedQuote, status: 'CONFIRM', approvalType: undefined },
            receiveAddress: selectedQuote.receiveAddress,
        });

        if (!newTrade || newTrade.status === 'ERROR') {
            return;
        }

        onSwap(selectedQuote);
    };

    const onRevokeClick = async () => {
        if (!selectedQuote?.receiveAddress) {
            return;
        }

        reportFormAction('revoke');

        await revokeApproval(selectedQuote);

        setIsRevokeModalOpen(true);
    };

    const onRefreshClick = async () => {
        reportFormAction('refresh');

        await refreshQuotes();
    };

    const isButtonBusy =
        !account ||
        isFormInvalid ||
        areFeesLoading ||
        isComposing ||
        isDiscoveryRunning ||
        isSwapButtonLoading ||
        isRevokeButtonLoading;
    const isSwapAvailable =
        status === 'APPROVAL_REQ' || status === 'CONFIRM' || status === 'SIGN_DATA';
    const hasPreapprovedAmount = new BigNumber(selectedQuote?.preapprovedStringAmount ?? 0).gt(0);
    if (revokeTxid) {
        return (
            <Column gap={16} alignItems="center">
                <Button
                    data-testid="@trading/form/swap-button"
                    intent="brand"
                    size="large"
                    width="100%"
                    isDisabled
                >
                    <Translation id="TR_TRADING_SWAP" />
                </Button>
                <PendingTransactionInfo
                    title={<Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKING_APPROVAL" />}
                    txidLabel={<Translation id="TR_EXCHANGE_APPROVAL_FORM_TRANSACTION_ID" />}
                    txidComponent={
                        revokeTxid ? (
                            <Address
                                isTruncated
                                isChunked={false}
                                value={revokeTxid}
                                intent="brand"
                                typographyStyle="body-md"
                                data-testid="@pending-transaction/txid/value"
                            />
                        ) : (
                            <Translation id="TR_UNKNOWN" />
                        )
                    }
                    onTxClick={
                        revokeTxid && account
                            ? () =>
                                  dispatch(
                                      openModal({
                                          type: 'transaction-detail',
                                          txid: revokeTxid,
                                          descriptor: account.descriptor,
                                          symbol: account.symbol,
                                          deviceState: account.deviceState,
                                          flow: 'detail',
                                      }),
                                  )
                            : undefined
                    }
                />
            </Column>
        );
    }

    if (!isSwapAvailable) {
        return (
            <Button
                onClick={() => handleRefreshClick(onRefreshClick)}
                intent="brand"
                size="large"
                width="100%"
                isLoading={isRefreshButtonLoading}
                isDisabled={isRefreshButtonLoading || isDiscoveryRunning}
            >
                <Translation id="TR_EXCHANGE_APPROVAL_FORM_REFRESH_BUTTON" />
            </Button>
        );
    }

    const isApprovalRequired = status === 'APPROVAL_REQ';

    return (
        <Column gap={16} alignItems="center">
            <Button
                data-testid="@trading/form/exchange-button"
                onClick={isApprovalRequired ? onContinueClick : () => handleSwapClick(onSwapClick)}
                intent="brand"
                size="large"
                width="100%"
                isLoading={isSwapButtonLoading || areFeesLoading || isComposing}
                isDisabled={isButtonBusy}
            >
                <Translation id={isApprovalRequired ? 'TR_CONTINUE' : 'TR_TRADING_SWAP'} />
            </Button>

            {hasPreapprovedAmount && (
                <TextButton
                    onClick={() => handleRevokeClick(onRevokeClick)}
                    isDisabled={isButtonBusy}
                    isLoading={isRevokeButtonLoading}
                >
                    <Translation id="TR_EXCHANGE_APPROVAL_FORM_REVOKE_BUTTON" />
                </TextButton>
            )}

            <TradingRevokeModal
                isOpen={isRevokeModalOpen}
                onClose={() => setIsRevokeModalOpen(false)}
                onSent={txid => {
                    setIsRevokeModalOpen(false);
                    setRevokeTxid(txid);
                }}
                getCryptoInfo={getCryptoInfo}
            />
        </Column>
    );
};
