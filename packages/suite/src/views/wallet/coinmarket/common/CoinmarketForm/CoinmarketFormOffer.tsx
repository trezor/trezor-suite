import { useState } from 'react';

import { CryptoId, ExchangeTrade } from 'invity-api';

import { Button, TextButton, Row, Column, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectedCrypto,
    getSelectQuoteTyped,
    isCoinmarketExchangeContext,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { Translation } from 'src/components/suite';
import { CoinmarketFormOfferItem } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferItem';
import { CoinmarketFormOfferCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferCryptoAmount';
import {
    coinmarketGetAmountLabels,
    coinmarketGetRoundedFiatAmount,
    coinmarketGetSectionActionLabel,
    getBestRatedQuote,
    parseCryptoId,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormOfferFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferFiatAmount';
import { CoinmarketTradeDetailType, CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContextValues } from 'src/types/coinmarket/coinmarketForm';
import { FORM_EXCHANGE_DEX, FORM_EXCHANGE_TYPE } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketFormOffersSwitcher } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOffersSwitcher';

const getSelectedQuote = (
    context: CoinmarketFormContextValues<CoinmarketTradeType>,
    bestScoredQuote: CoinmarketTradeDetailType | undefined,
) => {
    if (isCoinmarketExchangeContext(context)) {
        return context.getValues(FORM_EXCHANGE_TYPE) === FORM_EXCHANGE_DEX
            ? context.dexQuotes?.[0]
            : context.quotes?.[0];
    } else {
        return bestScoredQuote;
    }
};

export const CoinmarketFormOffer = () => {
    const [isCompareLoading, setIsCompareLoading] = useState<boolean>(false);
    const context = useCoinmarketFormContext();
    const { cryptoIdToPlatformName } = useCoinmarketInfo();
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
    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto });
    const sendAmount =
        !state.isLoadingOrInvalid && bestScoredQuoteAmounts?.sendAmount
            ? bestScoredQuoteAmounts.sendAmount
            : '0';

    const selectQuote = getSelectQuoteTyped(context);
    const shouldDisplayFiatAmount = isCoinmarketExchangeContext(context) ? false : amountInCrypto;
    const { networkId, contractAddress } = parseCryptoId(selectedCrypto?.value ?? ('' as CryptoId));
    const network = selectedCrypto?.value ? cryptoIdToPlatformName(networkId) : undefined;

    return (
        <Column alignItems="stretch" gap={spacings.lg}>
            <Column alignItems="stretch" gap={spacings.xs}>
                <Translation id={amountLabels.offerLabel} />
                {shouldDisplayFiatAmount ? (
                    <CoinmarketFormOfferFiatAmount
                        amount={coinmarketGetRoundedFiatAmount(sendAmount)}
                    />
                ) : (
                    <CoinmarketFormOfferCryptoAmount
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
                {isCoinmarketExchangeContext(context) && contractAddress && network && (
                    <Paragraph typographyStyle="label" variant="tertiary">
                        <Translation
                            id="TR_COINMARKET_ON_NETWORK_CHAIN"
                            values={{
                                networkName: network,
                            }}
                        />
                    </Paragraph>
                )}
            </Column>
            <Column alignItems="stretch" gap={spacings.xxs} margin={{ vertical: spacings.md }}>
                <Row justifyContent="space-between">
                    <Translation id="TR_COINMARKET_YOUR_BEST_OFFER" />
                    <TextButton
                        onClick={async () => {
                            setIsCompareLoading(true);
                            await goToOffers();
                        }}
                        size="small"
                        isDisabled={state.isLoadingOrInvalid}
                        isLoading={isCompareLoading}
                        data-testid="@coinmarket/form/compare-button"
                        type="button"
                    >
                        <Translation id="TR_COINMARKET_COMPARE_OFFERS" />
                    </TextButton>
                </Row>
                {isCoinmarketExchangeContext(context) ? (
                    <CoinmarketFormOffersSwitcher
                        context={context}
                        isFormLoading={state.isFormLoading}
                        isFormInvalid={state.isFormInvalid}
                        providers={providers}
                        quotes={quotes as ExchangeTrade[] | undefined}
                        bestRatedQuote={bestRatedQuote}
                    />
                ) : (
                    <CoinmarketFormOfferItem
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
                isDisabled={state.isLoadingOrInvalid || !quote}
                data-testid={`@coinmarket/form/${type}-button`}
            >
                <Translation id={coinmarketGetSectionActionLabel(type)} />
            </Button>
        </Column>
    );
};
