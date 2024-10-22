import { Icon, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { Trade } from 'src/types/wallet/coinmarketCommonTypes';
import { CoinmarketTestWrapper } from 'src/views/wallet/coinmarket';
import { useTheme } from 'styled-components';

const Arrow = () => {
    const theme = useTheme();

    return (
        <Row margin={{ left: spacings.xs, right: spacings.xs }}>
            <Icon color={theme.iconSubdued} size={13} name="caretRight" />
        </Row>
    );
};

interface CoinmarketTransactionAmountsProps {
    trade: Trade;
}

export const CoinmarketTransactionAmounts = ({ trade }: CoinmarketTransactionAmountsProps) => {
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();

    if (trade.tradeType === 'sell') {
        const { cryptoStringAmount, cryptoCurrency, fiatStringAmount, fiatCurrency } = trade.data;

        return (
            <Row flexWrap="wrap">
                <FormattedCryptoAmount
                    value={cryptoStringAmount}
                    symbol={cryptoCurrency ? cryptoIdToCoinSymbol(cryptoCurrency) : cryptoCurrency}
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

        return (
            <Row flexWrap="wrap">
                <FormattedCryptoAmount
                    value={sendStringAmount}
                    symbol={send ? cryptoIdToCoinSymbol(send) : send}
                />
                <Arrow />
                <FormattedCryptoAmount
                    value={receiveStringAmount}
                    symbol={receive ? cryptoIdToCoinSymbol(receive) : receive}
                />
            </Row>
        );
    }

    const { fiatStringAmount, fiatCurrency, receiveStringAmount, receiveCurrency } = trade.data;

    return (
        <Row flexWrap="wrap">
            <HiddenPlaceholder data-testid="@coinmarket/transaction/fiat-amount">
                {fiatStringAmount} {fiatCurrency}
            </HiddenPlaceholder>
            <Arrow />
            <CoinmarketTestWrapper data-testid="@coinmarket/transaction/crypto-amount">
                <FormattedCryptoAmount
                    value={receiveStringAmount}
                    symbol={
                        receiveCurrency ? cryptoIdToCoinSymbol(receiveCurrency) : receiveCurrency
                    }
                />
            </CoinmarketTestWrapper>
        </Row>
    );
};
