import CoinmarketOffersEmpty from './CoinmarketOffersEmpty';
import CoinmarketHeader from '../CoinmarketHeader/CoinmarketHeader';
import CoinmarketOffersItem from './CoinmarketOffersItem';
import {
    isCoinmarketExchangeOffers,
    useCoinmarketOffersContext,
    useFilteredQuotesByRateTypeAndExchangeType,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { getBestRatedQuote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import {
    FORM_EXCHANGE_DEX,
    FORM_RATE_FIXED,
    FROM_EXCHANGE_TYPE,
    FROM_RATE_TYPE,
} from 'src/constants/wallet/coinmarket/form';
import { CoinmarketFormContextValues } from 'src/types/coinmarket/coinmarketForm';

const CoinmarketSectionHeading = styled.div`
    margin: ${spacingsPx.md} 0 -${spacingsPx.xs};
`;

const ExchangeHeading = ({
    context,
}: {
    context: CoinmarketFormContextValues<CoinmarketTradeType>;
}) => {
    const isExchange = isCoinmarketExchangeOffers(context);
    const rateType = isExchange ? context.getValues(FROM_RATE_TYPE) : undefined;
    const exchangeType = isExchange ? context.getValues(FROM_EXCHANGE_TYPE) : undefined;
    const rateTypeTranslationId =
        rateType === FORM_RATE_FIXED ? 'TR_EXCHANGE_FIXED' : 'TR_EXCHANGE_FLOAT';
    const heading = exchangeType === FORM_EXCHANGE_DEX ? 'TR_EXCHANGE_DEX' : rateTypeTranslationId;

    if (!isExchange) return;

    return (
        <CoinmarketSectionHeading>
            <Translation id={heading} />
        </CoinmarketSectionHeading>
    );
};

const CoinmarketOffers = () => {
    const context = useCoinmarketOffersContext();
    const { type } = context;
    const quotes = useFilteredQuotesByRateTypeAndExchangeType(context);
    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;

    const bestRatedQuote = getBestRatedQuote(quotes, type);

    if (noOffers) return <CoinmarketOffersEmpty />;

    return (
        <>
            <CoinmarketHeader
                title="TR_COINMARKET_SHOW_OFFERS"
                titleTimer="TR_COINMARKET_OFFERS_REFRESH"
                showTimerNextToTitle={isCoinmarketExchangeOffers(context)}
            />
            <ExchangeHeading context={context} />
            {quotes.map(quote => (
                <CoinmarketOffersItem
                    key={quote?.orderId}
                    quote={quote}
                    isBestRate={bestRatedQuote?.orderId === quote?.orderId}
                />
            ))}
        </>
    );
};

export default CoinmarketOffers;
