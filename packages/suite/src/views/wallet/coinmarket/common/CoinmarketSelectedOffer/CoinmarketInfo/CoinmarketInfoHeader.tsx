import { Row } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { CryptoSymbol } from 'invity-api';
import { Translation } from 'src/components/suite';
import {
    cryptoToNetworkSymbol,
    isCryptoSymbolToken,
} from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketCoinImage } from 'src/views/wallet/coinmarket/common/CoinmarketCoinImage';
import styled from 'styled-components';

const Header = styled.div`
    padding-bottom: ${spacingsPx.xl};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
`;

const AccountText = styled.div`
    ${typography.titleSmall}
    padding-left: 7px;
`;

interface CoinmarketInfoHeaderProps {
    receiveCurrency?: CryptoSymbol;
}

export const CoinmarketInfoHeader = ({ receiveCurrency }: CoinmarketInfoHeaderProps) => {
    const network =
        receiveCurrency && isCryptoSymbolToken(receiveCurrency)
            ? cryptoToNetworkSymbol(receiveCurrency)?.toUpperCase()
            : undefined;

    return (
        <Header>
            <Row alignItems="center">
                <CoinmarketCoinImage symbol={receiveCurrency} size="large" />
                <AccountText>
                    {network ? (
                        <Translation
                            id="TR_COINMARKET_TOKEN_NETWORK"
                            values={{
                                tokenName: receiveCurrency,
                                networkName: network,
                            }}
                        />
                    ) : (
                        receiveCurrency
                    )}
                </AccountText>
            </Row>
        </Header>
    );
};
