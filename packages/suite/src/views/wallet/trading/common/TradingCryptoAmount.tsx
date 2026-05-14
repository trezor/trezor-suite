import { type CryptoId } from 'invity-api';
import styled from 'styled-components';

import { useTradingUtils } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { TradingTestWrapper } from 'src/views/wallet/trading';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

const LogoWrapper = styled.div`
    line-height: 0;
`;

export interface TradingCryptoAmountProps {
    amount?: string | number;
    cryptoId: CryptoId;
    displayLogo?: boolean;
    testId?: string;
}

export const TradingCryptoAmount = ({
    amount,
    cryptoId,
    displayLogo,
    testId,
}: TradingCryptoAmountProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoId);

    if (!amount || amount === '') {
        return (
            <Row alignItems="center">
                {displayLogo && (
                    <LogoWrapper>
                        <TradingCoinLogo cryptoId={cryptoId} margin={{ right: 8 }} />
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
                        <TradingCoinLogo cryptoId={cryptoId} margin={{ right: 8 }} />
                    </LogoWrapper>
                )}
                <FormattedCryptoAmount
                    value={amount}
                    symbol={coinSymbol}
                    contractAddress={contractAddress}
                    data-testid={testId ?? '@trading/offers/quote/crypto-amount'}
                />
            </Row>
        </TradingTestWrapper>
    );
};
