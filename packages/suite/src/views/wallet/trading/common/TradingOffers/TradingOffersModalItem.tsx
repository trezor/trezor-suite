import { memo, useCallback } from 'react';

import { type ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import {
    type TradingTradeType,
    selectTradingExchangeProviders,
    selectTradingProvidersByTradeType,
} from '@suite-common/trading';
import { CardList, Column, Row, Skeleton } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import { TradingQuoteAmount } from '../TradingQuoteAmount';
import { TradingRequestedAmountShortfallNote } from '../TradingRequestedAmountShortfallNote';
import { TradingUtilsProvider } from '../TradingUtils/TradingUtilsProvider';
import { TradingUtilsProviderKyc } from '../TradingUtils/TradingUtilsProviderKyc';
import { useTradingQuoteAmounts } from '../hooks/useTradingQuoteAmounts';

type TradingOffersModalItemProps = {
    quote: TradingTradeType;
    onSelect: (quote: TradingTradeType) => void;
};

const ProviderWrapper = styled.div`
    display: grid;
    grid-template-columns: minmax(10rem, auto) auto;
    gap: 16px;
    justify-content: center;
`;

const TradingOffersModalItemInner = ({ quote, onSelect }: TradingOffersModalItemProps) => {
    const context = useTradingFormContext();
    const providers = useSelector(reduxState =>
        selectTradingProvidersByTradeType(reduxState, context.type),
    );
    const exchangeProviders = useSelector(selectTradingExchangeProviders);
    const {
        form: {
            state: { isFormLoading },
        },
    } = context;
    const cryptoAmountProps = useTradingQuoteAmounts(quote, context.type);
    const { exchange } = quote;
    const exchangeComparatorProps = isTradingExchangeContext(context)
        ? {
              isDex: (quote as ExchangeTrade).isDex,
              providers: exchangeProviders,
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
            <Column gap={8} width="100%">
                <Row justifyContent="space-between" alignItems="center" width="100%">
                    <ProviderWrapper>
                        <TradingUtilsProvider providers={providers} exchange={exchange} />
                        {exchangeComparatorProps ? (
                            <TradingUtilsProviderKyc
                                exchange={exchange}
                                providers={exchangeComparatorProps.providers}
                                isForComparator
                                isDex={exchangeComparatorProps.isDex}
                            />
                        ) : (
                            <TradingUtilsProviderKyc isForComparator isBuySell />
                        )}
                    </ProviderWrapper>

                    {isFormLoading ? (
                        <Skeleton animate width={200} />
                    ) : (
                        <TradingQuoteAmount quote={quote} />
                    )}
                </Row>
                <TradingRequestedAmountShortfallNote quote={quote} />
            </Column>
        </CardList.Item>
    );
};

export const TradingOffersModalItem = memo(TradingOffersModalItemInner);
