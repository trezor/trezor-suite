import { type CryptoId } from 'invity-api';
import styled from 'styled-components';

import { AssetSymbol } from '@suite/assets';
import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { Row } from '@trezor/components';

import { FormattedCryptoAmount } from '#src/components/suite';
import { TradingCoinLogo } from '#src/views/wallet/trading/common/TradingCoinLogo';

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
    const { networkSymbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    if (!amount || amount === '') {
        return (
            <Row alignItems="center">
                {displayLogo && (
                    <LogoWrapper>
                        <TradingCoinLogo cryptoId={cryptoId} margin={{ right: 8 }} />
                    </LogoWrapper>
                )}
                {networkSymbol && (
                    <AssetSymbol
                        networkSymbol={networkSymbol}
                        contractAddress={contractAddress}
                        isTruncated
                    />
                )}
            </Row>
        );
    }

    return (
        <Row alignItems="center" data-testid="@trading/form/info/crypto-amount">
            {displayLogo && (
                <LogoWrapper>
                    <TradingCoinLogo cryptoId={cryptoId} margin={{ right: 8 }} />
                </LogoWrapper>
            )}
            <FormattedCryptoAmount
                value={amount}
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                data-testid={testId ?? '@trading/offers/quote/crypto-amount'}
            />
        </Row>
    );
};
