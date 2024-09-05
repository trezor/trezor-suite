import { Row } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import { CryptoId } from 'invity-api';
import { Translation } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';
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
    receiveCurrency?: CryptoId;
}

export const CoinmarketInfoHeader = ({ receiveCurrency }: CoinmarketInfoHeaderProps) => {
    const { cryptoIdToCoinSymbol, cryptoIdToPlatformName } = useCoinmarketInfo();

    const { networkId, contractAddress } = parseCryptoId(receiveCurrency!);
    const network = cryptoIdToPlatformName(networkId);

    return (
        <Header>
            <Row alignItems="center">
                <CoinmarketCoinLogo cryptoId={receiveCurrency!} size={24} />
                <AccountText>
                    {contractAddress && network ? (
                        <Translation
                            id="TR_COINMARKET_TOKEN_NETWORK"
                            values={{
                                tokenName: cryptoIdToCoinSymbol(receiveCurrency!),
                                networkName: network,
                            }}
                        />
                    ) : (
                        cryptoIdToCoinSymbol(receiveCurrency!)
                    )}
                </AccountText>
            </Row>
        </Header>
    );
};
