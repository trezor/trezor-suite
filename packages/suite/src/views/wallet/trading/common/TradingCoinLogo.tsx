import styled from 'styled-components';

import { useServices } from '@suite-common/dependency-injection';
import { parseCryptoId } from '@suite-common/trading';
import {
    findNetworkByCoingeckoId,
    getNetworks,
    selectNetworkConfigDeps,
} from '@suite-common/wallet-config';
import { TokenIcon } from '@trezor/product-components';

import { type TradingCoinLogoProps } from 'src/types/trading/trading';

const Wrapper = styled.div``;

export const TradingCoinLogo = ({
    cryptoId,
    size = 24,
    margin,
    className,
    showNetworkIcon,
}: TradingCoinLogoProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const networkSymbol = findNetworkByCoingeckoId(
        getNetworks(networkConfigDeps),
        networkId,
    )?.symbol;

    if (!networkSymbol) return null;

    return (
        <Wrapper className={className}>
            <TokenIcon
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
