import { useSelector } from 'react-redux';

import { type TradeExchangeAction, events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import {
    getProviderTransactionDeadline,
    getSimulatedReceiveAmount,
    hasFixedPsbtFee,
    selectTradingComposedTransactionInfo,
    selectTradingExchangeActiveTrade,
    selectTradingExchangeFormStep,
    selectTradingExchangeInfo,
    selectTradingExchangeIsLoading,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
    selectTradingExchangeSelectedQuoteTimestamp,
    useDexExchangeTxSimulation,
    useExchangeIssue,
} from '@suite-common/trading';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Button, Card, Column, H2, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowsClockwiseIcon } from '@trezor/icons';
import { useAsyncClickHandler, useIsPastDeadline } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { TxValidityCountdownBadge } from 'src/components/suite/TxValidityCountdownBadge';
import { TRADING_DEX_SOURCE_ORIGIN } from 'src/constants/wallet/trading/txSimulation';
import { useTradingExchangeConfirmFees } from 'src/hooks/wallet/trading/useTradingExchangeConfirmFees';
import { useTradingExchangeTradeActions } from 'src/hooks/wallet/trading/useTradingExchangeTradeActions';
import { type TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';

import { TradingOfferExchangeDetails } from './TradingOfferExchangeDetails';
import { TradingOfferExchangeIssueBanner } from './TradingOfferExchangeIssueBanner';
import { TradingOfferExchangeSimulationSubtitle } from './TradingOfferExchangeSimulationSubtitle';
import { useExchangeIssueAnalytics } from './useExchangeIssueAnalytics';
import { TradingInfoItem } from '../TradingInfo/TradingInfoItem';
import { getTradingNetworkFeeEdit } from '../TradingInfo/getTradingNetworkFeeEdit';

export const TradingOfferExchange = () => {
    const { handleClick, disabled } = useAsyncClickHandler();
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { device } = useDevice();
    const formStep = useSelector(selectTradingExchangeFormStep);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const receiveAccount = useSelector(
        (state: AccountsRootState) => selectAccountByKey(state, receiveAccountKey) ?? undefined,
    );

    const {
        account: sendAccount,
        refreshSelectedQuote,
        sendTransaction,
        signDataAndConfirm,
    } = useTradingExchangeTradeActions();

    const { feeInfo, composeFormState, applySelectedFee } =
        useTradingExchangeConfirmFees(sendAccount);
    const { composed, selectedFee } = useSelector(selectTradingComposedTransactionInfo);

    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const trade = useSelector(selectTradingExchangeActiveTrade);
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const selectedQuoteTimestamp = useSelector(selectTradingExchangeSelectedQuoteTimestamp);

    const isTxSimulationFeatureEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.trading.txSimulation, true),
    );

    const txSimulationParams = {
        account: sendAccount,
        isEnabled: isTxSimulationFeatureEnabled,
        sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
    };
    const {
        isLoading: isSimulationLoading,
        error: simulationError,
        data: simulationResult,
    } = useDexExchangeTxSimulation(txSimulationParams);
    const { issue, isSimulationEnabled, isSimulation } = useExchangeIssue(txSimulationParams);

    useExchangeIssueAnalytics({ issue, isSimulationLoading, isSimulation });

    const selectedTrade = trade?.data ?? selectedQuote;

    const providerTransactionDeadline = getProviderTransactionDeadline({
        quote: selectedQuote,
        networkType: sendAccount?.networkType,
        selectedQuoteTimestamp,
    });
    const isProviderTransactionExpired = useIsPastDeadline(providerTransactionDeadline);

    const isConfirmDisabled =
        isLoading ||
        !selectedQuote ||
        !sendAccount ||
        !device?.connected ||
        isSimulationLoading ||
        isProviderTransactionExpired;

    if (!selectedTrade) {
        return null;
    }

    const providers = exchangeInfo?.providerInfos;
    const amountLabels = tradingGetAmountLabels({ type: 'exchange', amountInCrypto: false });
    const { exchange, signData } = selectedTrade;
    const isSignData = formStep === 'SIGN_DATA' && !!signData;

    const networkFeeEdit = sendAccount
        ? getTradingNetworkFeeEdit({
              account: sendAccount,
              feeInfo,
              composeFormState,
              onConfirm: applySelectedFee,
              isTokenTransfer: !!composed?.token,
              hasFixedFee: hasFixedPsbtFee(selectedTrade, sendAccount.networkType),
          })
        : undefined;

    const simulatedReceiveAmount = getSimulatedReceiveAmount(
        simulationResult,
        selectedTrade.receive,
    );

    const reportConfirmAndSendStep = (action: TradeExchangeAction) => {
        analytics.report({
            type: events.tradeExchangeEvent.name,
            payload: {
                action,
                step: 'confirm-and-send',
                slippage: selectedTrade.swapSlippage,
                feeLevel: selectedFee,
            },
        });
    };

    const onConfirmAndSendClick = async () => {
        if (isSignData) {
            reportConfirmAndSendStep('continue');
            await signDataAndConfirm();

            return;
        }

        const result = await sendTransaction();

        reportConfirmAndSendStep(result ? 'continue' : 'cancel');
    };

    const onBackToTradeFormClick = () => {
        reportConfirmAndSendStep('cancel');
        dispatch(gotoThunk({ routeName: 'wallet-trading-exchange', preserveParams: true }));
    };

    return (
        <Column width="100%" alignItems="center">
            <Card width="100%" maxWidth="440px" data-testid="@trading/selected-offer">
                <Column gap={20}>
                    <Column gap={4} alignItems="start">
                        <Row justifyContent="space-between" alignItems="center" width="100%">
                            <H2 typographyStyle="headline-sm">
                                <Translation id="TR_TRADING_REVIEW_SWAP" />
                            </H2>
                            {providerTransactionDeadline !== undefined && (
                                <TxValidityCountdownBadge
                                    deadline={providerTransactionDeadline}
                                    pastDeadlineMessage="TR_TRADING_QUOTE_EXPIRED_TITLE"
                                    data-testid="@trading/offer/validity-timer"
                                />
                            )}
                        </Row>
                        <TradingOfferExchangeSimulationSubtitle
                            isSimulationEnabled={isSimulationEnabled}
                            isSimulationLoading={isSimulationLoading}
                            hasSimulationError={!!simulationError}
                        />
                    </Column>
                    <TradingInfoItem
                        key={amountLabels.sendLabel}
                        account={sendAccount}
                        label={amountLabels.sendLabel}
                        currency={selectedTrade.send}
                        amount={selectedTrade.sendStringAmount}
                    />

                    <TradingInfoItem
                        key={amountLabels.receiveLabel}
                        account={receiveAccount}
                        label={amountLabels.receiveLabel}
                        currency={selectedTrade.receive}
                        amount={simulatedReceiveAmount ?? selectedTrade.receiveStringAmount}
                        isAmountLoading={isSimulationLoading}
                        receiveAddress={selectedTrade.receiveAddress}
                        isReceive
                    />
                    {sendAccount && (
                        <TradingOfferExchangeDetails
                            account={sendAccount}
                            exchangeQuote={selectedTrade}
                            providers={providers as TradingExchangeProvidersInfoProps}
                            exchange={exchange}
                            networkFeeEdit={networkFeeEdit}
                        />
                    )}

                    {issue && (
                        <TradingOfferExchangeIssueBanner
                            issue={issue}
                            isContinueDisabled={isConfirmDisabled || disabled}
                            isContinueLoading={isLoading || disabled}
                            onContinueAnywayClick={() => handleClick(() => onConfirmAndSendClick())}
                        />
                    )}

                    {isProviderTransactionExpired && (
                        <Button
                            data-testid="@trading/offer/refresh-transaction"
                            iconLeft={ArrowsClockwiseIcon}
                            intent="warning"
                            priority="secondary"
                            isLoading={disabled}
                            isDisabled={isLoading || disabled}
                            onClick={() => handleClick(refreshSelectedQuote)}
                            size="large"
                            width="100%"
                        >
                            <Translation id="TR_TRADING_REFRESH_TRANSACTION" />
                        </Button>
                    )}

                    {!isProviderTransactionExpired && issue && (
                        <Button
                            data-testid="@trading/offer/back-to-trade-form"
                            intent="neutral"
                            isDisabled={isLoading || disabled}
                            onClick={onBackToTradeFormClick}
                            size="large"
                            width="100%"
                        >
                            <Translation id="TR_TRADING_BACK_TO_TRADE_FORM" />
                        </Button>
                    )}

                    {!isProviderTransactionExpired && !issue && (
                        <Button
                            data-testid="@trading/offer/confirm-on-trezor-and-send"
                            isLoading={isLoading || disabled}
                            isDisabled={isConfirmDisabled || disabled}
                            onClick={() => handleClick(() => onConfirmAndSendClick())}
                            size="large"
                            width="100%"
                        >
                            <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                        </Button>
                    )}
                </Column>
            </Card>
        </Column>
    );
};
