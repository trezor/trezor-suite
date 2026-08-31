import { useDispatch } from 'react-redux';

import { type TradeExchangeAction, events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { Feature, selectIsFeatureEnabled } from '@suite-common/message-system';
import {
    getSimulatedReceiveAmount,
    selectTradingExchangeActiveTrade,
    selectTradingExchangeFormStep,
    selectTradingExchangeInfo,
    selectTradingExchangeIsLoading,
    selectTradingExchangeReceiveAccountKey,
    selectTradingExchangeSelectedQuote,
    useDexExchangeTxSimulation,
    useExchangeIssue,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { Button, Card, Column, H2 } from '@trezor/components';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { TRADING_DEX_SOURCE_ORIGIN } from 'src/constants/wallet/trading/txSimulation';
import { useSelector } from 'src/hooks/suite';
import { useTradingExchangeTradeActions } from 'src/hooks/wallet/trading/useTradingExchangeTradeActions';
import { type TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';

import { TradingOfferExchangeDetails } from './TradingOfferExchangeDetails';
import { TradingOfferExchangeIssueBanner } from './TradingOfferExchangeIssueBanner';
import { TradingOfferExchangeSimulationSubtitle } from './TradingOfferExchangeSimulationSubtitle';
import { useExchangeIssueAnalytics } from './useExchangeIssueAnalytics';
import { TradingInfoItem } from '../TradingInfo/TradingInfoItem';

export const TradingOfferExchange = () => {
    const { handleClick, disabled } = useAsyncClickHandler();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { device } = useDevice();
    const dispatch = useDispatch();
    const formStep = useSelector(selectTradingExchangeFormStep);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const receiveAccount = useSelector(
        state => selectAccountByKey(state, receiveAccountKey) ?? undefined,
    );

    const {
        account: sendAccount,
        sendTransaction,
        signDataAndConfirm,
    } = useTradingExchangeTradeActions();
    const selectedQuote = useSelector(selectTradingExchangeSelectedQuote);
    const trade = useSelector(selectTradingExchangeActiveTrade);
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const isTxSimulationFeatureEnabled = useSelector(state =>
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

    const isConfirmDisabled =
        isLoading || !selectedQuote || !sendAccount || !device?.connected || isSimulationLoading;

    const selectedTrade = trade?.data ?? selectedQuote;

    if (!selectedTrade) {
        return null;
    }

    const providers = exchangeInfo?.providerInfos;
    const amountLabels = tradingGetAmountLabels({ type: 'exchange', amountInCrypto: false });
    const { exchange, signData } = selectedTrade;
    const isSignData = formStep === 'SIGN_DATA' && !!signData;

    const simulatedReceiveAmount = getSimulatedReceiveAmount(
        simulationResult,
        selectedTrade.receive,
    );
    const hasIssueToResolve = isSimulationEnabled && issue !== null;

    const reportConfirmAndSendStep = (action: TradeExchangeAction) => {
        analytics.report({
            type: events.tradeExchangeEvent.name,
            payload: {
                action,
                step: 'confirm-and-send',
                slippage: selectedTrade.swapSlippage,
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
        dispatch(goto({ routeName: 'wallet-trading-exchange', preserveParams: true }));
    };

    return (
        <Column width="100%" alignItems="center">
            <Card width="100%" maxWidth="440px" data-testid="@trading/selected-offer">
                <Column gap={20}>
                    <Column gap={4} alignItems="start">
                        <H2 typographyStyle="headline-sm">
                            <Translation id="TR_TRADING_REVIEW_SWAP" />
                        </H2>
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
                        />
                    )}

                    {issue && (
                        <TradingOfferExchangeIssueBanner
                            issue={issue}
                            isSimulationEnabled={isSimulationEnabled}
                            isContinueDisabled={isConfirmDisabled || disabled}
                            isContinueLoading={isLoading || disabled}
                            onContinueAnywayClick={() => handleClick(() => onConfirmAndSendClick())}
                        />
                    )}

                    {hasIssueToResolve ? (
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
                    ) : (
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
