import React from 'react';
import styled, { useTheme } from 'styled-components';
import { CoinmarketFiatAmount } from '../CoinmarketFiatAmount';
import { getCryptoQuoteAmountProps } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { FormattedCryptoAmount } from 'src/components/suite';
import { useCoinmarketInfo } from '../../../../../hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketTradeDetailType } from 'src/types/coinmarket/coinmarket';
import { spacingsPx } from '@trezor/theme';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    isCoinmarketBuyOffers,
    isCoinmarketSellOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CryptoId } from 'invity-api';
import { Icon } from '@trezor/components';

const Arrow = styled.div`
    display: flex;
    align-items: center;
`;

const AmountsWrapper = styled.div`
    font-size: 22px;
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.sm};
`;

interface CoinmarketFeaturedOffersAmountProps {
    fromAmount: React.ReactNode;
    toAmount: React.ReactNode;
}

interface CoinmarketFeaturedOffersAmountsProps {
    quote: CoinmarketTradeDetailType;
}

const CoinmarketFeaturedOffersAmount = ({
    fromAmount,
    toAmount,
}: CoinmarketFeaturedOffersAmountProps) => {
    const theme = useTheme();

    return (
        <AmountsWrapper>
            {fromAmount}
            <Arrow>
                <Icon color={theme.iconSubdued} size={20} name="arrowRightLong" />
            </Arrow>
            {toAmount}
        </AmountsWrapper>
    );
};

export const CoinmarketFeaturedOffersAmounts = ({
    quote,
}: CoinmarketFeaturedOffersAmountsProps) => {
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    const context = useCoinmarketFormContext();
    const quoteProps = getCryptoQuoteAmountProps(quote, context);

    if (!quoteProps?.receiveCurrency) return null;

    if (isCoinmarketBuyOffers(context)) {
        return (
            <CoinmarketFeaturedOffersAmount
                fromAmount={
                    <CoinmarketFiatAmount
                        amount={quoteProps.sendAmount}
                        currency={quoteProps.sendCurrency}
                    />
                }
                toAmount={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={quoteProps.sendAmount}
                        symbol={cryptoIdToCoinSymbol(quoteProps.receiveCurrency)}
                    />
                }
            />
        );
    }

    if (isCoinmarketSellOffers(context)) {
        return (
            <CoinmarketFeaturedOffersAmount
                fromAmount={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={quoteProps.receiveAmount}
                        symbol={cryptoIdToCoinSymbol(quoteProps.receiveCurrency)}
                    />
                }
                toAmount={
                    <CoinmarketFiatAmount
                        amount={quoteProps.sendAmount}
                        currency={quoteProps.sendCurrency}
                    />
                }
            />
        );
    }

    const sendCurrencyExchange = quoteProps?.sendCurrency as CryptoId | undefined;

    if (!sendCurrencyExchange) return null;

    return (
        <CoinmarketFeaturedOffersAmount
            fromAmount={
                <FormattedCryptoAmount
                    disableHiddenPlaceholder
                    value={quoteProps.sendAmount}
                    symbol={cryptoIdToCoinSymbol(sendCurrencyExchange)}
                />
            }
            toAmount={
                <FormattedCryptoAmount
                    disableHiddenPlaceholder
                    value={quoteProps.receiveAmount}
                    symbol={cryptoIdToCoinSymbol(quoteProps.receiveCurrency)}
                />
            }
        />
    );
};
