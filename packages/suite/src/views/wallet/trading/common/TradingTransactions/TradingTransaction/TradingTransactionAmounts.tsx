import { Icon, iconSizes, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { Trade } from 'src/types/wallet/tradingCommonTypes';
import { TradingTestWrapper } from 'src/views/wallet/trading';

const Arrow = () => (
    <Row margin={{ left: spacings.xs, right: spacings.xs }}>
        <Icon variant="tertiary" size={iconSizes.small} name="caretRight" />
    </Row>
);

interface TradingTransactionAmountsProps {
    trade: Trade;
}

export const TradingTransactionAmounts = ({ trade }: TradingTransactionAmountsProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();

    if (trade.tradeType === 'sell') {
        const { cryptoStringAmount, cryptoCurrency, fiatStringAmount, fiatCurrency } = trade.data;
        const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoCurrency);

        return (
            <Row flexWrap="wrap">
                <FormattedCryptoAmount
                    value={cryptoStringAmount}
                    symbol={coinSymbol}
                    contractAddress={contractAddress}
                />
                <Arrow />
                <HiddenPlaceholder>
                    {fiatStringAmount} {fiatCurrency}
                </HiddenPlaceholder>
            </Row>
        );
    }

    if (trade.tradeType === 'exchange') {
        const { send, sendStringAmount, receive, receiveStringAmount } = trade.data;
        const { coinSymbol: sendCoinSymbol, contractAddress: sendContractAddress } =
            cryptoIdToSymbolAndContractAddress(send);
        const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
            cryptoIdToSymbolAndContractAddress(receive);

        return (
            <Row flexWrap="wrap">
                <FormattedCryptoAmount
                    value={sendStringAmount}
                    symbol={sendCoinSymbol}
                    contractAddress={sendContractAddress}
                />
                <Arrow />
                <FormattedCryptoAmount
                    value={receiveStringAmount}
                    symbol={receiveCoinSymbol}
                    contractAddress={receiveContractAddress}
                />
            </Row>
        );
    }

    const { fiatStringAmount, fiatCurrency, receiveStringAmount, receiveCurrency } = trade.data;
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(receiveCurrency);

    return (
        <Row flexWrap="wrap">
            <HiddenPlaceholder data-testid="@trading/transaction/fiat-amount">
                {fiatStringAmount} {fiatCurrency}
            </HiddenPlaceholder>
            <Arrow />
            <TradingTestWrapper data-testid="@trading/transaction/crypto-amount">
                <FormattedCryptoAmount
                    value={receiveStringAmount}
                    symbol={coinSymbol}
                    contractAddress={contractAddress}
                />
            </TradingTestWrapper>
        </Row>
    );
};
