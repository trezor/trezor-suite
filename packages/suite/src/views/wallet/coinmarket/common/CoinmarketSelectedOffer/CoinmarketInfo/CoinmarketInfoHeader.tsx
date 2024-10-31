import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { CryptoId } from 'invity-api';
import { Translation } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';

interface CoinmarketInfoHeaderProps {
    receiveCurrency?: CryptoId;
}

export const CoinmarketInfoHeader = ({ receiveCurrency }: CoinmarketInfoHeaderProps) => {
    const { cryptoIdToCoinSymbol, cryptoIdToPlatformName } = useCoinmarketInfo();

    const { networkId, contractAddress } = parseCryptoId(receiveCurrency!);
    const network = cryptoIdToPlatformName(networkId);

    return (
        <Row gap={spacings.xs}>
            <CoinmarketCoinLogo cryptoId={receiveCurrency!} size={24} />
            <Text typographyStyle="titleSmall">
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
            </Text>
        </Row>
    );
};
