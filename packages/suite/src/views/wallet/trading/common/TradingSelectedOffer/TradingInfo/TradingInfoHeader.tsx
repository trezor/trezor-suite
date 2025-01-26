import { CryptoId } from 'invity-api';

import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { getDisplaySymbol } from '@suite-common/wallet-config';

import { Translation } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';

interface CoinmarketInfoHeaderProps {
    receiveCurrency?: CryptoId;
}

export const CoinmarketInfoHeader = ({ receiveCurrency }: CoinmarketInfoHeaderProps) => {
    const { cryptoIdToPlatformName, cryptoIdToSymbolAndContractAddress } = useCoinmarketInfo();

    const { networkId } = parseCryptoId(receiveCurrency!);
    const platform = cryptoIdToPlatformName(networkId);

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(receiveCurrency);
    const displaySymbol = coinSymbol ? getDisplaySymbol(coinSymbol, contractAddress) : '';

    return (
        <Row gap={spacings.xs}>
            {receiveCurrency && <CoinmarketCoinLogo cryptoId={receiveCurrency} size={24} />}
            <Text typographyStyle="titleSmall">
                {coinSymbol && contractAddress ? (
                    <Translation
                        id="TR_COINMARKET_TOKEN_NETWORK"
                        values={{
                            tokenName: displaySymbol,
                            networkName: platform,
                        }}
                    />
                ) : (
                    displaySymbol
                )}
            </Text>
        </Row>
    );
};
