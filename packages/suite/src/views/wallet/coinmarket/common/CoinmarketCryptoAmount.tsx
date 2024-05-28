import { FormattedCryptoAmount } from 'src/components/suite';
import invityAPI from 'src/services/suite/invityAPI';
import styled from 'styled-components';

const TokenLogo = styled.img`
    display: flex;
    align-items: center;
    height: 21px;
`;

interface CoinmarketCryptoAmountProps {
    amount?: string | number;
    symbol?: string;
    displaySymbol?: boolean;
}

export const CoinmarketCryptoAmount = ({
    amount,
    symbol,
    displaySymbol,
}: CoinmarketCryptoAmountProps) => {
    if (amount) {
        if (displaySymbol && symbol) {
            return (
                <>
                    <TokenLogo src={invityAPI.getCoinLogoUrl(symbol)} />
                    <FormattedCryptoAmount value={amount} symbol={symbol} />
                </>
            );
        }

        return <FormattedCryptoAmount value={amount} symbol={symbol} disableHiddenPlaceholder />;
    }

    return <>{symbol?.toUpperCase()}</>;
};
