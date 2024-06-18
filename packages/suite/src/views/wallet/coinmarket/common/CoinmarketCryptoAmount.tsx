import { spacingsPx } from '@trezor/theme';
import { FormattedCryptoAmount } from 'src/components/suite';
import styled from 'styled-components';
import CoinmarketCoinImage from './CoinmarketCoinImage';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TokenLogo = styled(CoinmarketCoinImage)`
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
    const symbolUpper = symbol?.toUpperCase();

    if (!amount || amount === '') {
        return (
            <Wrapper>
                {displayLogo && <TokenLogo symbol={symbol} />}
                {symbolUpper}
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            {displayLogo && <TokenLogo symbol={symbol} />}
            <FormattedCryptoAmount value={amount} symbol={symbol} disableHiddenPlaceholder />
        </Wrapper>
    );
};
