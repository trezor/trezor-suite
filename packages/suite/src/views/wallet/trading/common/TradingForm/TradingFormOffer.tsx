import { useState } from 'react';

import { CryptoId } from 'invity-api';

import {
    TRADING_EXCHANGE_FORM,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingTradeType,
    type TradingType,
    parseCryptoId,
    useTradingInfo,
} from '@suite-common/trading';
import { Button, Column, Paragraph, Row, TextButton, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormContextValues } from 'src/types/trading/tradingForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
    getSelectedCrypto,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    tradingGetAmountLabels,
    tradingGetRoundedFiatAmount,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { TradingFormOfferCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferCryptoAmount';
import { TradingFormOfferFiatAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferFiatAmount';
import { TradingFormOfferItem } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferItem';
import { TradingFormOfferOTC } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferOTC';
import { TradingFormOffersSwitcher } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffersSwitcher';

const getSelectedQuote = (
    context: TradingFormContextValues<TradingType>,
    bestScoredQuote: TradingTradeType | undefined,
) => {
    if (isTradingExchangeContext(context)) {
        return context.getValues(TRADING_EXCHANGE_FORM) === TRADING_EXCHANGE_FORM_DEX
            ? context.dexQuotes?.[0]
            : context.cexQuotes?.[0];
    } else {
        return bestScoredQuote;
    }
};

export const TradingFormOffer = () => {
    const [isCompareLoading, setIsCompareLoading] = useState<boolean>(false);
    const context = useTradingFormContext();
    const {
        type,
        quotes,
        goToOffers,
        getValues,
        form: { state },
    } = context;
    const { cryptoIdToPlatformName } = useTradingInfo();
    const providers = getProvidersInfoProps(context);
    const bestScoredQuote = quotes?.[0];
    const quote = getSelectedQuote(context, bestScoredQuote);
    const bestScoredQuoteAmounts = getCryptoQuoteAmountProps(quote, context);

    const selectedCrypto = getSelectedCrypto(context);
    const receiveCurrency = bestScoredQuoteAmounts?.receiveCurrency;
    const { amountInCrypto } = getValues();
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });
    const sendAmount =
        !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.sendAmount
            ? bestScoredQuoteAmounts.sendAmount
            : '0';

    const selectQuote = getSelectQuoteTyped(context);
    const shouldDisplayFiatAmount = isTradingExchangeContext(context) ? false : amountInCrypto;
    const { networkId, contractAddress } = parseCryptoId(selectedCrypto?.value ?? ('' as CryptoId));
    const network = selectedCrypto?.value ? cryptoIdToPlatformName(networkId) : undefined;

    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    const showProviderAdjustedAmountTooltip =
        isTradingSellContext(context) && bestScoredQuoteAmounts && !state.isFormLoading;

    const onSelectQuote = () => {
        if (!quote) {
            return;
        }

        selectQuote(quote);
    };

    const onCompareAllOffersClick = async () => {
        setIsCompareLoading(true);
        await goToOffers();
    };

    return (
        <Column gap={spacings.lg}>
            <Column gap={spacings.xs} data-testid="@trading/best-offer">
                <Translation id={amountLabels.offerLabel} />
                {shouldDisplayFiatAmount ? (
                    <TradingFormOfferFiatAmount amount={tradingGetRoundedFiatAmount(sendAmount)} />
                ) : (
                    <TradingFormOfferCryptoAmount
                        amount={
                            !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.receiveAmount
                                ? bestScoredQuoteAmounts.receiveAmount
                                : '0'
                        }
                        cryptoId={
                            !state.isLoadingOrInvalid && receiveCurrency
                                ? receiveCurrency
                                : (selectedCrypto?.value as CryptoId)
                        }
                    />
                )}
                {isTradingExchangeContext(context) && contractAddress && network && (
                    <Paragraph typographyStyle="label" variant="tertiary">
                        <Translation
                            id="TR_TRADING_ON_NETWORK_CHAIN"
                            values={{
                                networkName: network,
                            }}
                        />
                    </Paragraph>
                )}
            </Column>
            <Column gap={spacings.xxs} margin={{ vertical: spacings.md }}>
                <Row justifyContent="space-between">
                    {showProviderAdjustedAmountTooltip ? (
                        <Tooltip
                            hasIcon
                            placement="right"
                            content={
                                <Translation
                                    id="TR_SELL_PROVIDER_ADJUSTED_AMOUNT"
                                    values={{
                                        roundedAmountWithSymbol: (
                                            <TradingCryptoAmount
                                                amount={bestScoredQuoteAmounts.receiveAmount}
                                                cryptoId={
                                                    bestScoredQuoteAmounts.receiveCurrency as CryptoId
                                                }
                                            />
                                        ),
                                    }}
                                />
                            }
                        >
                            <Translation id="TR_TRADING_YOUR_BEST_OFFER" />
                        </Tooltip>
                    ) : (
                        <Translation id="TR_TRADING_YOUR_BEST_OFFER" />
                    )}
                    <TextButton
                        onClick={onCompareAllOffersClick}
                        size="small"
                        isDisabled={state.isLoadingOrInvalid}
                        isLoading={isCompareLoading}
                        data-testid="@trading/form/compare-button"
                        type="button"
                    >
                        <Translation id="TR_TRADING_COMPARE_OFFERS" />
                    </TextButton>
                </Row>
                {isTradingExchangeContext(context) ? (
                    <TradingFormOffersSwitcher
                        context={context}
                        isFormLoading={state.isFormLoading}
                        isFormInvalid={state.isFormInvalid}
                        providers={providers}
                    />
                ) : (
                    <TradingFormOfferItem
                        bestQuote={quote}
                        isFormLoading={state.isFormLoading}
                        isFormInvalid={state.isFormInvalid}
                        providers={providers}
                    />
                )}
            </Column>
            <Button
                onClick={onSelectQuote}
                variant="primary"
                margin={{
                    top: spacings.md,
                }}
                isFullWidth
                isDisabled={tradingDeviceDisconnected || state.isLoadingOrInvalid || !quote}
                data-testid={`@trading/form/${type}-button`}
            >
                <Translation id={tradingGetSectionActionLabel(type)} />
            </Button>
            {(type === 'buy' || type === 'sell') && <TradingFormOfferOTC />}
        </Column>
    );
};
