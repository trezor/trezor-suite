import { spacings } from '@trezor/theme';
import { FormattedCryptoAmount } from 'src/components/suite';
import styled from 'styled-components';
import { Row } from '@trezor/components';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CryptoId } from 'invity-api';
import { CoinmarketTestWrapper } from 'src/views/wallet/coinmarket';

const LogoWrapper = styled.div`
    line-height: 0;
`;

export interface CoinmarketCryptoAmountProps {
    amount?: string | number;
    cryptoId: CryptoId;
    displayLogo?: boolean;
}

export const CoinmarketCryptoAmount = ({
    amount,
    cryptoId,
    displayLogo,
}: CoinmarketCryptoAmountProps) => {
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    const symbol = cryptoIdToCoinSymbol(cryptoId);

    if (!amount || amount === '') {
        return (
            <Row alignItems="center">
                {displayLogo && (
                    <LogoWrapper>
                        <CoinmarketCoinLogo cryptoId={cryptoId} margin={{ right: spacings.sm }} />
                    </LogoWrapper>
                )}
                {symbol}
            </Row>
        );
    }

    return (
        <CoinmarketTestWrapper data-testid="@coinmarket/form/info/crypto-amount">
            <Row alignItems="center">
                {displayLogo && (
                    <LogoWrapper>
                        <CoinmarketCoinLogo cryptoId={cryptoId} margin={{ right: spacings.sm }} />
                    </LogoWrapper>
                )}
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
