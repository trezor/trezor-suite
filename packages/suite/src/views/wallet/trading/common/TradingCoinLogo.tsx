import styled from 'styled-components';

import { cryptoIdToNetwork, isCryptoIdForNativeToken, parseCryptoId } from '@suite-common/trading';
import { AssetLogo } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

import { TradingCoinLogoProps } from 'src/types/trading/trading';

const Wrapper = styled.div``;

export const TradingCoinLogo = ({
    cryptoId,
    size = 24,
    margin,
    className,
}: TradingCoinLogoProps) => {
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
