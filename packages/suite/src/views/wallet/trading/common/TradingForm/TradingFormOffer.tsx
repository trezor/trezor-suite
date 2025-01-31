import { useState } from 'react';

import { CryptoId } from 'invity-api';

import { type TradingTradeType, type TradingType, parseCryptoId } from '@suite-common/trading';
import { Button, Column, Paragraph, Row, TextButton } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { FORM_EXCHANGE_DEX, FORM_EXCHANGE_TYPE } from 'src/constants/wallet/trading/form';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { TradingFormContextValues } from 'src/types/trading/tradingForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectQuoteTyped,
    getSelectedCrypto,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import {
    getBestRatedQuote,
    tradingGetAmountLabels,
    tradingGetRoundedFiatAmount,
    tradingGetSectionActionLabel,
} from 'src/utils/wallet/trading/tradingUtils';
import { TradingFormOfferCryptoAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferCryptoAmount';
import { TradingFormOfferFiatAmount } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferFiatAmount';
import { TradingFormOfferItem } from 'src/views/wallet/trading/common/TradingForm/TradingFormOfferItem';
import { TradingFormOffersSwitcher } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffersSwitcher';

const getSelectedQuote = (
    context: TradingFormContextValues<TradingType>,
    bestScoredQuote: TradingTradeType | undefined,
) => {
    if (isTradingExchangeContext(context)) {
        return context.getValues(FORM_EXCHANGE_TYPE) === FORM_EXCHANGE_DEX
            ? context.dexQuotes?.[0]
            : context.cexQuotes?.[0];
    } else {
        return bestScoredQuote;
    }
};

export const TradingFormOffer = () => {
    const [isCompareLoading, setIsCompareLoading] = useState<boolean>(false);
    const context = useTradingFormContext();
    const { cryptoIdToPlatformName } = useTradingInfo();
    const {
        type,
        quotes,
        goToOffers,
        getValues,
        form: { state },
    } = context;
    const providers = getProvidersInfoProps(context);
    const bestScoredQuote = quotes?.[0];
    const quote = getSelectedQuote(context, bestScoredQuote);
    const bestRatedQuote = getBestRatedQuote(quotes, type);
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
                    <Translation id="TR_TRADING_YOUR_BEST_OFFER" />
                    <TextButton
                        onClick={async () => {
                            setIsCompareLoading(true);
                            await goToOffers();
                        }}
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
                        bestRatedQuote={bestRatedQuote}
                    />
                ) : (
                    <TradingFormOfferItem
                        bestQuote={quote}
                        isFormLoading={state.isFormLoading}
                        isFormInvalid={state.isFormInvalid}
                        providers={providers}
                        isBestRate={bestRatedQuote?.orderId === quote?.orderId}
                    />
                )}
            </Column>
            <Button
                onClick={() => {
                    if (quote) {
                        selectQuote(quote);
                    }
                }}
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
        </Column>
    );
};
