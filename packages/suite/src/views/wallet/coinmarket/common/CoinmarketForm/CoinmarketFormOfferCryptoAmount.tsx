import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import { CoinmarketCoinImage } from '../CoinmarketCoinImage';
import { CoinmarketAmountContainer, CoinmarketAmountWrapper } from 'src/views/wallet/coinmarket';
import { FormattedCryptoAmount } from 'src/components/suite';

const TokenWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const TokenLogoBig = styled(CoinmarketCoinImage)`
    margin: 0 ${spacingsPx.xs} 0 0;
`;

export interface CoinmarketCryptoAmountProps {
    amount: string | number;
    symbol: string;
}

const CoinmarketFormOfferCryptoAmount = ({ amount, symbol }: CoinmarketCryptoAmountProps) => {
    return (
        <CoinmarketAmountContainer>
            <CoinmarketAmountWrapper>
                <TokenWrapper>
                    <TokenLogoBig symbol={symbol} size="large" />
                </TokenWrapper>
                <FormattedCryptoAmount value={amount} symbol={symbol} isRawString isBalance />
            </CoinmarketAmountWrapper>
        </CoinmarketAmountContainer>
    );
};

export default CoinmarketFormOfferCryptoAmount;
