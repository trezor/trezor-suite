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

const TokenLogoBig = styled.img`
    height: 32px;
    margin: 0 ${spacingsPx.xxxs} 0 ${spacingsPx.xs};
`;

// using formatted symbol from FormattedCryptoAmount
const FormattedCryptoAmountWithoutSymbol = styled(FormattedCryptoAmount)`
    position: relative;

    span:nth-child(2) {
        position: absolute;
        top: 0;
        left: 100%;
        margin-left: 40px;
        white-space: nowrap;
    }
`;

interface CoinmarketCryptoAmountProps {
    amount?: string | number;
    symbol?: string;
    displayLogo?: boolean | 'center'; // center - show logo between amount and symbol
}

export const CoinmarketCryptoAmount = ({
    amount,
    symbol,
    displayLogo,
}: CoinmarketCryptoAmountProps) => {
    const logoSrc = symbol ? invityAPI.getCoinLogoUrl(symbol) : null;
    const symbolUpper = symbol?.toUpperCase();

    const Logo = () => displayLogo && logoSrc && <TokenLogo src={logoSrc} />;

    if (!amount || amount === '') {
        return (
            <Wrapper>
                <Logo />
                {symbolUpper}
            </Wrapper>
        );
    }

    if (displayLogo === 'center' && logoSrc) {
        return (
            <Wrapper>
                <FormattedCryptoAmountWithoutSymbol
                    value={amount}
                    symbol={symbol}
                    disableHiddenPlaceholder
                />
                <TokenLogoBig src={logoSrc} />
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
