import { CryptoId } from 'invity-api';
import styled from 'styled-components';

import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { TradingTestWrapper } from 'src/views/wallet/trading';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

const LogoWrapper = styled.div`
    line-height: 0;
`;

export interface TradingCryptoAmountProps {
    amount?: string | number;
    cryptoId: CryptoId;
    displayLogo?: boolean;
}

export const TradingCryptoAmount = ({
    amount,
    cryptoId,
    displayLogo,
}: TradingCryptoAmountProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoId);

    if (!amount || amount === '') {
        return (
            <Row alignItems="center">
                {displayLogo && (
                    <LogoWrapper>
                        <TradingCoinLogo cryptoId={cryptoId} margin={{ right: spacings.xs }} />
                    </LogoWrapper>
                )}
                {coinSymbol ? getDisplaySymbol(coinSymbol, contractAddress) : ''}
            </Row>
        );
    }

    return (
        <TradingTestWrapper data-testid="@trading/form/info/crypto-amount">
            <Row alignItems="center">
                {displayLogo && (
                    <LogoWrapper>
                        <TradingCoinLogo cryptoId={cryptoId} margin={{ right: spacings.xs }} />
                    </LogoWrapper>
                )}
                <FormattedCryptoAmount
                    value={amount}
                    symbol={coinSymbol}
                    contractAddress={contractAddress}
                    disableHiddenPlaceholder
                    data-testid="@trading/offers/quote/crypto-amount"
                />
            </Row>
        </TradingTestWrapper>
    );
};
