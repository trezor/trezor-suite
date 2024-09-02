import { spacingsPx } from '@trezor/theme';
import { FormattedCryptoAmount } from 'src/components/suite';
import styled from 'styled-components';
import { Row } from '@trezor/components';
import { CoinmarketCoinImage } from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';
import { CoinmarketTestWrapper } from 'src/views/wallet/coinmarket';

const TokenLogo = styled(CoinmarketCoinImage)`
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
            <Row alignItems="center">
                {displayLogo && <TokenLogo symbol={symbol} />}
                {symbolUpper}
            </Row>
        );
    }

    return (
        <CoinmarketTestWrapper data-testid="@coinmarket/form/info/crypto-amount">
            <Row alignItems="center">
                {displayLogo && <TokenLogo symbol={symbol} />}
                <FormattedCryptoAmount
                    value={amount}
                    symbol={symbol}
                    disableHiddenPlaceholder
                    data-testid="@coinmarket/offers/quote/crypto-amount"
                />
            </Row>
        </CoinmarketTestWrapper>
    );
};
