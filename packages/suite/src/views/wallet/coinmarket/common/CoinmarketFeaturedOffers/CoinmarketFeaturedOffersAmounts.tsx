import styled, { useTheme } from 'styled-components';
import { useCoinmarketInfo } from '../../../../../hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketFiatAmount } from '../CoinmarketFiatAmount';
import { isBuyTrade } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { FormattedCryptoAmount } from 'src/components/suite';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { IconLegacy } from '@trezor/components';
import { BuySellQuote } from './CoinmarketFeaturedOffersItem';

const Arrow = styled.div`
    display: flex;
    align-items: center;
    padding: 0 11px;
`;

const AmountsWrapper = styled.div`
    font-size: 22px;
    display: flex;
`;

const CoinmarketFeaturedOffersAmounts = ({ quote }: { quote: BuySellQuote }) => {
    const { getNetworkSymbol } = useCoinmarketInfo();
    const theme = useTheme();

    const fiatAmount = (
        <CoinmarketFiatAmount amount={quote.fiatStringAmount} currency={quote.fiatCurrency} />
    );
    const fromAmount = isBuyTrade(quote) ? (
        fiatAmount
    ) : (
        <FormattedCryptoAmount
            disableHiddenPlaceholder
            value={quote.cryptoStringAmount}
            symbol={getNetworkSymbol(quote.cryptoCurrency!)}
        />
    );
    const toAmount = isBuyTrade(quote) ? (
        <FormattedCryptoAmount
            disableHiddenPlaceholder
            value={quote.receiveStringAmount}
            symbol={getNetworkSymbol(quote.receiveCurrency!)}
        />
    ) : (
        fiatAmount
    );

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

export default CoinmarketFeaturedOffersAmounts;
