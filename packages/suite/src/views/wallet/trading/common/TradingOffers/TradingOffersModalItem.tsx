import { useCallback } from 'react';

import { type ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import { type TradingTradeType } from '@suite-common/trading';
import { CardList, Column, Row, SkeletonRectangle, Text } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getCryptoQuoteAmountProps,
    getProvidersInfoProps,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

import { useTradingOfferRate } from './useTradingOfferRate';
import { TradingUtilsKyc } from '../TradingUtils/TradingUtilsKyc';
import { TradingUtilsProvider } from '../TradingUtils/TradingUtilsProvider';

type TradingOffersModalItemProps = {
    quote: TradingTradeType;
    onSelect: (quote: TradingTradeType) => void;
};

const ProviderWrapper = styled.div`
    display: grid;
    grid-template-columns: minmax(10rem, auto) auto;
    gap: 1rem;
    justify-content: center;
`;

export const TradingOffersModalItem = ({ quote, onSelect }: TradingOffersModalItemProps) => {
    const context = useTradingFormContext();
    const providers = getProvidersInfoProps(context);
    const {
        form: {
            state: { isFormLoading },
        },
    } = context;
    const cryptoAmountProps = getCryptoQuoteAmountProps(quote, context);
    const formattedRate = useTradingOfferRate(quote);
    const { exchange } = quote;
    const exchangeComparatorProps = isTradingExchangeContext(context)
        ? {
              isDex: (quote as ExchangeTrade).isDex,
              providers: context.exchangeInfo?.providerInfos,
          }
        : undefined;

    const onSelectQuote = useCallback(() => {
        onSelect(quote);
    }, [onSelect, quote]);

    if (!cryptoAmountProps) return null;

    return (
        <CardList.Item
            onClick={onSelectQuote}
            data-testid="@trading/offers/quote"
            data-testid-alt={`@trading/offers/quote-${exchange}`}
            isDisabled={isFormLoading}
        >
            <Column gap={16} width="100%">
                <Row justifyContent="space-between" alignItems="center" width="100%">
                    <ProviderWrapper>
                        <TradingUtilsProvider providers={providers} exchange={exchange} />
                        {exchangeComparatorProps && (
                            <TradingUtilsKyc
                                exchange={exchange}
                                providers={exchangeComparatorProps.providers}
                                isForComparator
                                isDex={exchangeComparatorProps.isDex}
                            />
                        )}
                    </ProviderWrapper>

                    {isFormLoading && <SkeletonRectangle animate width={200} />}
                    {!isFormLoading && formattedRate && (
                        <Text typographyStyle="body-sm-strong">{formattedRate}</Text>
                    )}
                </Row>
            </Column>
        </CardList.Item>
    );
};
