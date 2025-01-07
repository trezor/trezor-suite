import React from 'react';

import styled, { useTheme } from 'styled-components';
import { CryptoId } from 'invity-api';

import { spacingsPx } from '@trezor/theme';
import { Icon } from '@trezor/components';

import {
    getCryptoQuoteAmountProps,
    isCoinmarketBuyContext,
    isCoinmarketSellContext,
} from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { FormattedCryptoAmount } from 'src/components/suite';
import { CoinmarketTradeDetailType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketFiatAmount } from 'src/views/wallet/coinmarket/common/CoinmarketFiatAmount';

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
    const { cryptoIdToSymbolAndContractAddress } = useCoinmarketInfo();
    const context = useCoinmarketFormContext();
    const quoteProps = getCryptoQuoteAmountProps(quote, context);

    if (!quoteProps?.receiveCurrency) return null;

    const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
        cryptoIdToSymbolAndContractAddress(quoteProps.receiveCurrency);

    if (isCoinmarketBuyContext(context)) {
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
                        value={quoteProps.receiveAmount}
                        symbol={receiveCoinSymbol}
                        contractAddress={receiveContractAddress}
                    />
                }
            />
        );
    }

    if (isCoinmarketSellContext(context)) {
        return (
            <CoinmarketFeaturedOffersAmount
                fromAmount={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={quoteProps.receiveAmount}
                        symbol={receiveCoinSymbol}
                        contractAddress={receiveContractAddress}
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

    const { coinSymbol: sendCoinSymbol, contractAddress: sendContractAddress } =
        cryptoIdToSymbolAndContractAddress(sendCurrencyExchange);

    return (
        <CoinmarketFeaturedOffersAmount
            fromAmount={
                <FormattedCryptoAmount
                    disableHiddenPlaceholder
                    value={quoteProps.sendAmount}
                    symbol={sendCoinSymbol}
                    contractAddress={sendContractAddress}
                />
            }
            toAmount={
                <FormattedCryptoAmount
                    disableHiddenPlaceholder
                    value={quoteProps.receiveAmount}
                    symbol={receiveCoinSymbol}
                    contractAddress={receiveContractAddress}
                />
            }
        />
    );
};
