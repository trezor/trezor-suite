import { spacingsPx } from '@trezor/theme';
import { FormattedCryptoAmount } from 'src/components/suite';
import invityAPI from 'src/services/suite/invityAPI';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TokenLogo = styled.img`
    height: 21px;
    margin-right: ${spacingsPx.sm};
`;

interface CoinmarketCryptoAmountProps {
    amount?: string | number;
    symbol?: string;
    displayLogo?: boolean;
}

export const CoinmarketCryptoAmount = ({
    amount,
    symbol,
    displayLogo,
}: CoinmarketCryptoAmountProps) => {
    const Logo = () =>
        displayLogo && symbol && <TokenLogo src={invityAPI.getCoinLogoUrl(symbol)} />;

    if (!amount || amount === '') {
        return (
            <Wrapper>
                <Logo />
                {symbol?.toUpperCase()}
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <Logo />
            <FormattedCryptoAmount value={amount} symbol={symbol} disableHiddenPlaceholder />
        </Wrapper>
    );
};
