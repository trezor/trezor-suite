import React from 'react';
import styled, { useTheme } from 'styled-components';
import { CoinmarketFiatAmount } from '../CoinmarketFiatAmount';
import {
    isBuyTrade,
    isExchangeTrade,
    isSellTrade,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { FormattedCryptoAmount } from 'src/components/suite';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { IconLegacy } from '@trezor/components';
import { CoinmarketTradeDetailType } from 'src/types/coinmarket/coinmarket';
import { spacingsPx } from '@trezor/theme';

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

const CoinmarketFeaturedOffersAmount = ({
    fromAmount,
    toAmount,
}: {
    fromAmount: React.ReactNode;
    toAmount: React.ReactNode;
}) => {
    const theme = useTheme();

    return (
        <AmountsWrapper>
            {fromAmount}
            <Arrow>
                <IconLegacy
                    color={theme.legacy.TYPE_LIGHT_GREY}
                    size={20}
                    icon="ARROW_RIGHT_LONG"
                />
            </Arrow>
            {toAmount}
        </AmountsWrapper>
    );
};

export const CoinmarketFeaturedOffersAmounts = ({
    quote,
}: {
    quote: CoinmarketTradeDetailType;
}) => {
    if (isBuyTrade(quote)) {
        return (
            <CoinmarketFeaturedOffersAmount
                fromAmount={
                    <CoinmarketFiatAmount
                        amount={quote.fiatStringAmount}
                        currency={quote.fiatCurrency}
                    />
                }
                toAmount={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={quote.receiveStringAmount}
                        symbol={cryptoToCoinSymbol(quote.receiveCurrency!)}
                    />
                }
            />
        );
    } else if (isSellTrade(quote)) {
        return (
            <CoinmarketFeaturedOffersAmount
                fromAmount={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={quote.cryptoStringAmount}
                        symbol={cryptoToCoinSymbol(quote.cryptoCurrency!)}
                    />
                }
                toAmount={
                    <CoinmarketFiatAmount
                        amount={quote.fiatStringAmount}
                        currency={quote.fiatCurrency}
                    />
                }
            />
        );
    } else if (isExchangeTrade(quote)) {
        return (
            <CoinmarketFeaturedOffersAmount
                fromAmount={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={quote.sendStringAmount}
                        symbol={cryptoToCoinSymbol(quote.send!)}
                    />
                }
                toAmount={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={quote.receiveStringAmount}
                        symbol={cryptoToCoinSymbol(quote.receive!)}
                    />
                }
            />
        );
    }
};
