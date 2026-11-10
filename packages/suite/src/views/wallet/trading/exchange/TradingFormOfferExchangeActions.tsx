import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    type TradingFormAccountRootState,
    type TradingRootState,
    getApprovalFlowSteps,
    requiresTokenApproval,
    selectIsTradingNetworkFeeMissing,
    selectTradingExchangeQuoteToEstimate,
    selectTradingSendAccount,
    tradingExchangeActions,
} from '@suite-common/trading';
import { isAmountTooHigh } from '@suite-common/wallet-utils';
import { Button } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { selectExchangeQuoteThunk } from '#src/actions/wallet/trading/exchange/selectExchangeQuoteThunk';
import { useTradingFormContext } from '#src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from '#src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { useTradingStellarActivation } from '#src/hooks/wallet/trading/useTradingStellarActivation';
import { getTradingFirstOutput } from '#src/utils/wallet/trading/tradingUtils';
import { TradingFormApproval } from '#src/views/wallet/trading/common/TradingForm/TradingFormApproval';
import { TradingFormOfferConfirmButton } from '#src/views/wallet/trading/common/TradingForm/TradingFormOffer/components/TradingFormOfferConfirmButton';
import { useTradingFormOfferCommon } from '#src/views/wallet/trading/common/TradingForm/TradingFormOffer/hooks/useTradingFormOfferCommon';
import { useReceiveAddressModalControls } from '#src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

export const TradingFormOfferExchangeActions = () => {
    const { dispatch } = useServices(injectDispatch);
    const context = useTradingFormContext<'exchange'>();
    const {
        watch,
        getValues,
        shouldSendInSats,
        tradingReceiveAddress,
        isLoadingQuote,
        setIsLoadingQuote,
        confirmTrade,
        isComposing,
        refreshQuotes,
        form: { state, helpers },
    } = context;
    const account = useSelector((reduxState: TradingFormAccountRootState) =>
        selectTradingSendAccount(reduxState, 'exchange'),
    );

    const modalControls = useReceiveAddressModalControls();
    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();

    const { outputs, sendCryptoSelect, receiveCryptoSelect, exchangeType, rateType, provider } =
        watch();
    const { amount, tokenAddress } = getTradingFirstOutput(outputs);
    const areSatsUsed = !!shouldSendInSats;

    const { quote, selectedAssetCryptoId, isBaseButtonDisabled } =
        useTradingFormOfferCommon<'exchange'>();

    const isNetworkFeeMissing = useSelector((reduxState: TradingRootState) =>
        selectIsTradingNetworkFeeMissing(
            reduxState,
            selectTradingExchangeQuoteToEstimate(reduxState, {
                provider,
                exchangeType,
                sendCryptoId: sendCryptoSelect?.id,
            }),
        ),
    );

    const { stellarActivateButton, stellarActivateModal } = useTradingStellarActivation({
        account: tradingReceiveAddress.selectedAccount ?? undefined,
        receiveCryptoId: selectedAssetCryptoId ?? undefined,
    });

    const isReceiveAddressSelected = !!tradingReceiveAddress.receiveAddress;
    const shouldShowApprovalStep = quote !== undefined && requiresTokenApproval(quote);
    const isQuoteOutdated = quote?.send !== sendCryptoSelect?.id;
    const isQuoteForSelectedReceive = quote?.receive === receiveCryptoSelect?.id;
    const amountTooHigh = account
        ? isAmountTooHigh({
              amount,
              contractAddress: tokenAddress,
              account,
              areSatsUsed,
          })
        : false;

    const isLoading = shouldShowApprovalStep
        ? state.isFormLoading || isLoadingQuote || isQuoteOutdated
        : state.isFormLoading || isLoadingQuote;

    const isButtonDisabled =
        !account ||
        isBaseButtonDisabled ||
        amountTooHigh ||
        isNetworkFeeMissing ||
        isComposing ||
        isLoading;

    useEffect(() => {
        const initConfirmTrade = async () => {
            if (
                shouldShowApprovalStep &&
                tradingReceiveAddress.receiveAddress &&
                isQuoteForSelectedReceive
            ) {
                dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
                const { receiveAddress } = tradingReceiveAddress;

                setIsLoadingQuote(true);
                try {
                    await confirmTrade({ trade: quote, receiveAddress, approvalFlow: true });
                } catch {
                    console.error('Failed to confirm trade on quote change');
                } finally {
                    setIsLoadingQuote(false);
                }
            }
        };

        initConfirmTrade();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        quote,
        shouldShowApprovalStep,
        tradingReceiveAddress.receiveAddress,
        isQuoteForSelectedReceive,
    ]);

    const selectQuote = (trade: ExchangeTrade) => {
        dispatch(tradingExchangeActions.saveFormValues(getValues()));
        dispatch(
            selectExchangeQuoteThunk({
                quote: trade,
                exchangeType,
                rateType,
                fractionButton: helpers.fractionButton,
            }),
        );
    };

    const startApprovalFlow = (trade: ExchangeTrade) => {
        dispatch(tradingExchangeActions.saveFormValues(getValues()));
        dispatch(tradingExchangeActions.startApprovalFlow(getApprovalFlowSteps(trade)));
        dispatch(gotoThunk({ routeName: 'wallet-trading-exchange-approval' }));
    };

    const onSelectQuote = async () => {
        if (!quote || !tradingReceiveAddress.receiveAddress) return;

        const { receiveAddress } = tradingReceiveAddress;
        try {
            const newTrade = await confirmTrade({ trade: quote, receiveAddress });

            if (!newTrade) return;

            selectQuote(newTrade);
        } catch {
            // error already logged by confirmTrade thunk
        }
    };

    const onContinueClick = () => {
        modalControls.open('accountModal');
    };

    const renderActionButton = () => {
        if (!isReceiveAddressSelected && quote) {
            return isButtonDisabled ? null : (
                <Button
                    onClick={onContinueClick}
                    intent="brand"
                    size="large"
                    minWidth={160}
                    width="100%"
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            );
        }

        if (shouldShowApprovalStep && quote && !isLoading) {
            return (
                <TradingFormApproval
                    isComposing={isComposing}
                    isFormInvalid={state.isFormInvalid}
                    refreshQuotes={refreshQuotes}
                    onStartApprovalFlow={startApprovalFlow}
                    onSwap={selectQuote}
                    getCryptoInfo={getCryptoInfo}
                />
            );
        }

        if (stellarActivateButton) {
            return stellarActivateButton;
        }

        if (isButtonDisabled) {
            return null;
        }

        return (
            <TradingFormOfferConfirmButton
                translationId="TR_TRADING_SWAP"
                onClick={onSelectQuote}
                testId="@trading/form/exchange-button"
            />
        );
    };

    return (
        <>
            {renderActionButton()}

            {stellarActivateModal}
        </>
    );
};
