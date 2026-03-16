import styled from 'styled-components';

import { parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { AssetLogo } from '@trezor/product-components';

import { type TradingCoinLogoProps } from 'src/types/trading/trading';

const Wrapper = styled.div``;

export const TradingCoinLogo = ({
    cryptoId,
    size = 24,
    margin,
    className,
    showNetworkIcon,
}: TradingCoinLogoProps) => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const { cryptoIdToNativeCoinSymbol } = useTradingUtils();
    const networkSymbol = cryptoIdToNativeCoinSymbol(cryptoId);

    return (
        <Wrapper className={className}>
            <AssetLogo
                coingeckoId={networkId}
                symbol={networkSymbol}
                contractAddress={contractAddress}
                size={size}
                placeholder={networkId.toUpperCase()}
                margin={margin}
                showNetworkIcon={showNetworkIcon}
            />
        </Wrapper>
    );
};
