import { type TradingTransaction, useTradingUtils } from '@suite-common/trading';
import { Icon, Row } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';

const Arrow = () => (
    <Row margin={{ left: 8, right: 8 }}>
        <Icon intent="neutral" priority="secondary" size={12} as={CaretRightIcon} />
    </Row>
);

interface TradingTransactionAmountsProps {
    trade: TradingTransaction;
}

export const TradingTransactionAmounts = ({ trade }: TradingTransactionAmountsProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

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
                    data-testid="@trading/transactions/send/amount"
                />
                <Arrow />
                <FormattedCryptoAmount
                    value={receiveStringAmount}
                    symbol={receiveCoinSymbol}
                    contractAddress={receiveContractAddress}
                    data-testid="@trading/transactions/receive/amount"
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
            <FormattedCryptoAmount
                value={receiveStringAmount}
                symbol={coinSymbol}
                contractAddress={contractAddress}
                data-testid="@trading/transaction/crypto-amount"
            />
        </Row>
    );
};
