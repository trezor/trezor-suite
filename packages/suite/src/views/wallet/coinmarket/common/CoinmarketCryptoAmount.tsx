import { spacingsPx } from '@trezor/theme';
import { FormattedCryptoAmount } from 'src/components/suite';
import styled from 'styled-components';
import { Row } from '@trezor/components';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CryptoId } from 'invity-api';

const StyledCoinmarketCoinLogo = styled(CoinmarketCoinLogo)`
    margin-right: ${spacingsPx.sm};
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
    const { getNetworkSymbol } = useCoinmarketInfo();
    const symbol = getNetworkSymbol(cryptoId);

    return (
        <Row alignItems="center">
            {displayLogo && <StyledCoinmarketCoinLogo cryptoId={cryptoId} />}
            {amount ? (
                <FormattedCryptoAmount value={amount} symbol={symbol} disableHiddenPlaceholder />
            ) : (
                symbol?.toUpperCase()
            )}
        </Row>
    );
};
