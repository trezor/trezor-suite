import styled from 'styled-components';

import { AssetIcon } from '@suite/asset-icon';
import { parseCryptoId } from '@suite-common/trading';
import { getNetworkByCoingeckoId } from '@suite-common/wallet-config';

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
    const networkSymbol = getNetworkByCoingeckoId(networkId)?.symbol;

    if (!networkSymbol) return null;

    return (
        <Wrapper className={className}>
            <AssetIcon
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
