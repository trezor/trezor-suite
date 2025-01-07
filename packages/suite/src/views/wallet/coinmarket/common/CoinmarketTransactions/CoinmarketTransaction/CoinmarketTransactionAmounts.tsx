import { Icon, iconSizes, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import { CoinmarketTestWrapper } from 'src/views/wallet/coinmarket';

const Arrow = () => (
    <Row margin={{ left: spacings.xs, right: spacings.xs }}>
        <Icon variant="tertiary" size={iconSizes.small} name="caretRight" />
    </Row>
);

interface CoinmarketTransactionAmountsProps {
    trade: Trade;
}

export const CoinmarketTransactionAmounts = ({ trade }: CoinmarketTransactionAmountsProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useCoinmarketInfo();

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
            <HiddenPlaceholder data-testid="@coinmarket/transaction/fiat-amount">
                {fiatStringAmount} {fiatCurrency}
            </HiddenPlaceholder>
            <Arrow />
            <CoinmarketTestWrapper data-testid="@coinmarket/transaction/crypto-amount">
                <FormattedCryptoAmount
                    value={receiveStringAmount}
                    symbol={coinSymbol}
                    contractAddress={contractAddress}
                />
            </CoinmarketTestWrapper>
        </Row>
    );
};
