import styled from 'styled-components';

import { AssetLogo } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { CoinmarketCoinLogoProps } from 'src/types/coinmarket/coinmarket';
import {
    cryptoIdToNetwork,
    isCryptoIdForNativeToken,
    parseCryptoId,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';

const Wrapper = styled.div``;

export const CoinmarketCoinLogo = ({
    cryptoId,
    size = 24,
    margin,
    className,
}: CoinmarketCoinLogoProps) => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const network = cryptoIdToNetwork(cryptoId);

    if (isCryptoIdForNativeToken(cryptoId) && network) {
        return <CoinLogo size={size} symbol={network.symbol} />;
    }

    return (
        <Wrapper className={className}>
            <AssetLogo
                coingeckoId={networkId}
                contractAddress={contractAddress}
                size={size}
                placeholder={networkId.toUpperCase()}
                margin={margin}
            />
        </Wrapper>
    );
};
