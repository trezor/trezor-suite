import { useSelector } from 'react-redux';

import { type ExchangeTrade } from 'invity-api';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    type TradingFormAccountRootState,
    selectTradingExchangeSelectedQuote,
    selectTradingSendAccount,
} from '@suite-common/trading';
import {
    type FeesRootState,
    selectAreFeesLoading,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { Button, Column, TextButton } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { useExchangeApproval } from 'src/hooks/wallet/trading/form/exchange/useExchangeApproval';
import { type GetTradingExchangeCryptoInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';

type TradingFormApprovalProps = {
    isComposing: boolean;
    isFormInvalid: boolean;
    refreshQuotes: () => Promise<void>;
    onStartApprovalFlow: (quote: ExchangeTrade) => void;
    onManageApproval: () => void;
    onSwap: (quote: ExchangeTrade) => void;
    getCryptoInfo: GetTradingExchangeCryptoInfo;
};

export const TradingFormApproval = ({
    isComposing,
    isFormInvalid,
    refreshQuotes,
    onStartApprovalFlow,
    onManageApproval,
    onSwap,
    getCryptoInfo,
}: TradingFormApprovalProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const account = useSelector((reduxState: TradingFormAccountRootState) =>
        selectTradingSendAccount(reduxState, 'exchange'),
    );
    const { confirmApproval } = useExchangeApproval({ account });

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );

    const { handleClick: handleSwapClick, disabled: isSwapButtonLoading } = useAsyncClickHandler();
    const { handleClick: handleRefreshClick, disabled: isRefreshButtonLoading } =
        useAsyncClickHandler();

    const status = selectedQuote?.status;

    const reportFormAction = (action: 'swap' | 'manage' | 'refresh') => {
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

    const onManageApprovalClick = () => {
        reportFormAction('manage');
        onManageApproval();
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
        isSwapButtonLoading;
    const isSwapAvailable =
        status === 'APPROVAL_REQ' || status === 'CONFIRM' || status === 'SIGN_DATA';

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

            {/* Shown even without an allowance, so a zero limit after a revoke stays visible. */}
            <TextButton
                onClick={onManageApprovalClick}
                isDisabled={isButtonBusy}
                data-testid="@trading/form/manage-approval-button"
            >
                <Translation id="TR_EXCHANGE_APPROVAL_FORM_MANAGE_BUTTON" />
            </TextButton>
        </Column>
    );
};
