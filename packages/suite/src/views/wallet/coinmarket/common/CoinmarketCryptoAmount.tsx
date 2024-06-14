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

export interface CoinmarketCryptoAmountProps {
    amount?: string | number;
    symbol?: string;
    displayLogo?: boolean;
}

export const CoinmarketCryptoAmount = ({
    amount,
    symbol,
    displayLogo,
}: CoinmarketCryptoAmountProps) => {
    const logoSrc = symbol ? invityAPI.getCoinLogoUrl(symbol) : null;
    const symbolUpper = symbol?.toUpperCase();

    const Logo = () => displayLogo && logoSrc && <TokenLogo src={logoSrc} alt="" />;

    if (!amount || amount === '') {
        return (
            <Wrapper>
                <Logo />
                {symbolUpper}
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
