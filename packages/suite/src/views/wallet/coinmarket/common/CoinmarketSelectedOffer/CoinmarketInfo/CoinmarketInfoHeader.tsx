import { CryptoId } from 'invity-api';

import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import {
    getCoinmarketNetworkDisplaySymbol,
    parseCryptoId,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';

interface CoinmarketInfoHeaderProps {
    receiveCurrency?: CryptoId;
}

export const CoinmarketInfoHeader = ({ receiveCurrency }: CoinmarketInfoHeaderProps) => {
    const { cryptoIdToCoinSymbol, cryptoIdToPlatformName } = useCoinmarketInfo();

    const { networkId, contractAddress } = parseCryptoId(receiveCurrency!);
    const platform = cryptoIdToPlatformName(networkId);
    const displaySymbol = platform ? getCoinmarketNetworkDisplaySymbol(platform) : platform;
    const tokenNameHelper = receiveCurrency && cryptoIdToCoinSymbol(receiveCurrency);
    const tokenName = tokenNameHelper ? getCoinmarketNetworkDisplaySymbol(tokenNameHelper) : '';

    return (
        <Row gap={spacings.xs}>
            {receiveCurrency && <CoinmarketCoinLogo cryptoId={receiveCurrency} size={24} />}
            <Text typographyStyle="titleSmall">
                {contractAddress && displaySymbol ? (
                    <Translation
                        id="TR_COINMARKET_TOKEN_NETWORK"
                        values={{
                            tokenName,
                            networkName: displaySymbol,
                        }}
                    />
                ) : (
                    tokenName
                )}
            </Text>
        </Row>
    );
};
