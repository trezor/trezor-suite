import { Button, TextButton } from '@trezor/components';
import { CryptoId } from 'invity-api';
import styled from 'styled-components';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    getSelectedCrypto,
    getSelectQuoteTyped,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { useState } from 'react';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { Translation } from 'src/components/suite';
import { CoinmarketFormOfferItem } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferItem';
import {
    CoinmarketFormInputLabelText,
    CoinmarketFormInputLabelWrapper,
} from 'src/views/wallet/coinmarket';
import { CoinmarketFormOfferCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferCryptoAmount';
import {
    coinmarketGetAmountLabels,
    coinmarketGetRoundedFiatAmount,
    coinmarketGetSectionActionLabel,
    getBestRatedQuote,
    parseCryptoId,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketFormOfferFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOfferFiatAmount';
import { isCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketFormOffersSwitcher } from './CoinmarketFormOffersSwitcher';
import { ExchangeTrade } from 'invity-api';
import { CoinmarketTradeDetailType, CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContextValues } from 'src/types/coinmarket/coinmarketForm';
import { FORM_EXCHANGE_DEX, FORM_EXCHANGE_TYPE } from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

const CoinmarketFormOfferHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: ${spacingsPx.xs};
    margin-top: ${spacingsPx.xxl};

    ${SCREEN_QUERY.MOBILE} {
        margin-top: ${spacingsPx.sm};
    }
`;
const CoinmarketFormOfferHeaderText = styled.div``;

// reason: special case for loading
// eslint-disable-next-line local-rules/no-override-ds-component
const CoinmarketFormOfferHeaderButton = styled(TextButton)`
    ${typography.hint};
    margin-top: ${spacingsPx.xxxs};

    div {
        ${typography.hint}
        color: ${({ theme }) => theme.textPrimaryDefault};
    }

    [class^='Spinner'] {
        margin-right: ${spacingsPx.xxs};
        filter: none;
    }
`;

const CoinmarketFormOfferChain = styled.div`
    margin-top: ${spacingsPx.xs};
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
`;

const getSelectedQuote = (
    context: CoinmarketFormContextValues<CoinmarketTradeType>,
    bestScoredQuote: CoinmarketTradeDetailType | undefined,
) => {
    if (isCoinmarketExchangeOffers(context)) {
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
    const shouldDisplayFiatAmount = isCoinmarketExchangeOffers(context) ? false : amountInCrypto;
    const { networkId, contractAddress } = parseCryptoId(selectedCrypto?.value ?? ('' as CryptoId));
    const network = selectedCrypto?.value ? cryptoIdToPlatformName(networkId) : undefined;

    return (
        <>
            <CoinmarketFormInputLabelWrapper>
                <CoinmarketFormInputLabelText>
                    <Translation id={amountLabels.offerLabel} />
                </CoinmarketFormInputLabelText>
            </CoinmarketFormInputLabelWrapper>
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
            {isCoinmarketExchangeOffers(context) && contractAddress && network && (
                <CoinmarketFormOfferChain>
                    <Translation
                        id="TR_COINMARKET_ON_NETWORK_CHAIN"
                        values={{
                            networkName: network,
                        }}
                    />
                </CoinmarketFormOfferChain>
            )}
            <CoinmarketFormOfferHeader>
                <CoinmarketFormOfferHeaderText>
                    <Translation id="TR_COINMARKET_YOUR_BEST_OFFER" />
                </CoinmarketFormOfferHeaderText>
                <CoinmarketFormOfferHeaderButton
                    onClick={async () => {
                        setIsCompareLoading(true);
                        await goToOffers();
                    }}
                    type="button"
                    size="medium"
                    isDisabled={state.isLoadingOrInvalid}
                    isLoading={isCompareLoading}
                    data-testid="@coinmarket/form/compare-button"
                >
                    <Translation id="TR_COINMARKET_COMPARE_OFFERS" />
                </CoinmarketFormOfferHeaderButton>
            </CoinmarketFormOfferHeader>
            {isCoinmarketExchangeOffers(context) ? (
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
            <Button
                onClick={() => {
                    if (quote) {
                        selectQuote(quote);
                    }
                }}
                type="button"
                variant="primary"
                margin={{
                    top: spacings.xxl,
                }}
                isFullWidth
                isDisabled={state.isLoadingOrInvalid || !quote}
                data-testid={`@coinmarket/form/${type}-button`}
            >
                <Translation id={coinmarketGetSectionActionLabel(type)} />
            </Button>
        </>
    );
};
