import React from 'react';

import { CryptoId } from 'invity-api';
import styled, { useTheme } from 'styled-components';

import { TradingTradeType, useTradingInfo } from '@suite-common/trading';
import { Icon } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    getCryptoQuoteAmountProps,
    isTradingBuyContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingFiatAmount } from 'src/views/wallet/trading/common/TradingFiatAmount';

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

interface TradingFeaturedOffersAmountProps {
    fromAmount: React.ReactNode;
    toAmount: React.ReactNode;
}

interface TradingFeaturedOffersAmountsProps {
    quote: TradingTradeType;
}

const TradingFeaturedOffersAmount = ({
    fromAmount,
    toAmount,
}: TradingFeaturedOffersAmountProps) => {
    const theme = useTheme();

    return (
        <AmountsWrapper>
            {fromAmount}
            <Arrow>
                <Icon color={theme.iconSubdued} size={20} name="arrowRight" />
            </Arrow>
            {toAmount}
        </AmountsWrapper>
    );
};

export const TradingFeaturedOffersAmounts = ({ quote }: TradingFeaturedOffersAmountsProps) => {
    const context = useTradingFormContext();
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();
    const quoteProps = getCryptoQuoteAmountProps(quote, context);

    if (!quoteProps?.receiveCurrency) return null;

    const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
        cryptoIdToSymbolAndContractAddress(quoteProps.receiveCurrency);

    if (isTradingBuyContext(context)) {
        return (
            <TradingFeaturedOffersAmount
                fromAmount={
                    <TradingFiatAmount
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

    if (isTradingSellContext(context)) {
        return (
            <TradingFeaturedOffersAmount
                fromAmount={
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={quoteProps.receiveAmount}
                        symbol={receiveCoinSymbol}
                        contractAddress={receiveContractAddress}
                    />
                }
                toAmount={
                    <TradingFiatAmount
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
        <TradingFeaturedOffersAmount
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
