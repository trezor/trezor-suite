import styled from 'styled-components';
import { CryptoId } from 'invity-api';

import { spacings } from '@trezor/theme';
import { Row } from '@trezor/components';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import { FormattedCryptoAmount } from 'src/components/suite';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
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
    const { cryptoIdToSymbolAndContractAddress } = useCoinmarketInfo();
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoId);

    if (!amount || amount === '') {
        return (
            <Row alignItems="center">
                {displayLogo && (
                    <LogoWrapper>
                        <CoinmarketCoinLogo cryptoId={cryptoId} margin={{ right: spacings.xs }} />
                    </LogoWrapper>
                )}
                {coinSymbol ? getDisplaySymbol(coinSymbol, contractAddress) : ''}
            </Row>
        );
    }

    return (
        <CoinmarketTestWrapper data-testid="@coinmarket/form/info/crypto-amount">
            <Row alignItems="center">
                {displayLogo && (
                    <LogoWrapper>
                        <CoinmarketCoinLogo cryptoId={cryptoId} margin={{ right: spacings.xs }} />
                    </LogoWrapper>
                )}
                <FormattedCryptoAmount
                    value={amount}
                    symbol={coinSymbol}
                    contractAddress={contractAddress}
                    disableHiddenPlaceholder
                    data-testid="@coinmarket/offers/quote/crypto-amount"
                />
            </Row>
        </CoinmarketTestWrapper>
    );
};
