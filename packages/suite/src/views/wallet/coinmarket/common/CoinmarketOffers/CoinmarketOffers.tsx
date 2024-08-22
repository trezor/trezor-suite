import CoinmarketOffersEmpty from './CoinmarketOffersEmpty';
import CoinmarketHeader from '../CoinmarketHeader/CoinmarketHeader';
import CoinmarketOffersItem from './CoinmarketOffersItem';
import {
    isCoinmarketExchangeOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { getBestRatedQuote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { ExchangeTrade } from 'invity-api';
import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Translation } from 'src/components/suite';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const CoinmarketSectionHeading = styled.div`
    margin: ${spacingsPx.md} 0 -${spacingsPx.xs};
`;

// temporary solution for exchange, will be deleted in next release
const CoinmarketOffersExchange = () => {
    const { quotes, exchangeInfo } = useCoinmarketOffersContext<CoinmarketTradeExchangeType>();

    if (!quotes) return null;

    const getQuotesByRateType = (isFixedRate: boolean) =>
        quotes.filter(
            q =>
                exchangeInfo?.providerInfos[q.exchange || '']?.isFixedRate === isFixedRate &&
                !q.isDex,
        );

    const fixed = getQuotesByRateType(true);
    const float = getQuotesByRateType(false);
    const dex = quotes.filter(q => q.isDex);

    const renderQuotes = (quotes: ExchangeTrade[], heading: ExtendedMessageDescriptor['id']) => {
        if (quotes.length === 0) return null;

        return (
            <>
                <CoinmarketSectionHeading>
                    <Translation id={heading} />
                </CoinmarketSectionHeading>
                {quotes.map(quote => {
                    return (
                        <CoinmarketOffersItem
                            key={quote.orderId}
                            quote={quote}
                            isBestRate={false}
                        />
                    );
                })}
            </>
        );
    };

    return (
        <>
            {renderQuotes(dex, 'TR_EXCHANGE_DEX')}
            {renderQuotes(fixed, 'TR_EXCHANGE_FIXED')}
            {renderQuotes(float, 'TR_EXCHANGE_FLOAT')}
        </>
    );
};

const CoinmarketOffers = () => {
    const context = useCoinmarketOffersContext();
    const { type } = context;
    const quotes = context?.quotes ?? [];
    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;

    const bestRatedQuote = getBestRatedQuote(quotes, type);

    const getOffers = () => {
        if (noOffers) return <CoinmarketOffersEmpty />;

        if (isCoinmarketExchangeOffers(context)) return <CoinmarketOffersExchange />;

        return quotes.map(quote => (
            <CoinmarketOffersItem
                key={quote?.orderId}
                quote={quote}
                isBestRate={bestRatedQuote?.orderId === quote?.orderId}
            />
        ));
    };

    return (
        <>
            <CoinmarketHeader
                title="TR_COINMARKET_SHOW_OFFERS"
                titleTimer="TR_COINMARKET_OFFERS_REFRESH"
                showTimerNextToTitle={isCoinmarketExchangeOffers(context)}
            />
            {getOffers()}
        </>
    );
};

export default CoinmarketOffers;
