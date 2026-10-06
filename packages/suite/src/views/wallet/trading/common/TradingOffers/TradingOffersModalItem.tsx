import { memo, useCallback } from 'react';

import { type ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import {
    type TradingTradeType,
    selectTradingExchangeProviders,
    selectTradingProvidersByTradeType,
} from '@suite-common/trading';
import { CardList, Column, Skeleton, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import { TradingQuoteAmount } from '../TradingQuoteAmount';
import { TradingRequestedAmountShortfallNote } from '../TradingRequestedAmountShortfallNote';
import { TradingUtilsProvider } from '../TradingUtils/TradingUtilsProvider';
import { TradingUtilsProviderKyc } from '../TradingUtils/TradingUtilsProviderKyc';
import { useTradingQuoteAmounts } from '../hooks/useTradingQuoteAmounts';

const ItemWrapper = styled.div`
    display: grid;
    grid-template-columns: 250px 1fr 1fr;
    gap: 16px;
    align-items: center;
`;

type TradingOffersModalItemProps = {
    quote: TradingTradeType;
    onSelect: (quote: TradingTradeType) => void;
};

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

    const exchangeTypeLabel = exchangeComparatorProps ? (
        <Text
            typographyStyle="body-sm"
            intent="neutral"
            priority="secondary"
            data-testid="@trading/offers/quote/exchange-type"
        >
            <Translation
                id={
                    exchangeComparatorProps.isDex
                        ? 'TR_TRADING_DEX_TOOLTIP'
                        : 'TR_TRADING_CEX_TOOLTIP'
                }
            />
        </Text>
    ) : undefined;

    return (
        <CardList.Item
            onClick={onSelectQuote}
            data-testid="@trading/offers/quote"
            data-testid-alt={`@trading/offers/quote-${exchange}`}
            isDisabled={isFormLoading}
        >
            <Column width="100%">
                <ItemWrapper>
                    <TradingUtilsProvider
                        providers={providers}
                        exchange={exchange}
                        subtitle={exchangeTypeLabel}
                        iconMaxHeight={32}
                    />
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
                    <Column justifyContent="flex-end">
                        {isFormLoading ? (
                            <Skeleton animate width={100} />
                        ) : (
                            <TradingQuoteAmount quote={quote} />
                        )}
                    </Column>
                </ItemWrapper>
                <TradingRequestedAmountShortfallNote quote={quote} />
            </Column>
        </CardList.Item>
    );
};

export const TradingOffersModalItem = memo(TradingOffersModalItemInner);
