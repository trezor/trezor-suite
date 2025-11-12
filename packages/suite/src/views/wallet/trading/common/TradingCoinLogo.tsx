import styled from 'styled-components';

import { parseCryptoId, useTradingInfo } from '@suite-common/trading';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { AssetLogo } from '@trezor/components';

import { TradingCoinLogoProps } from 'src/types/trading/trading';

const Wrapper = styled.div``;

export const TradingCoinLogo = ({
    cryptoId,
    size = 24,
    margin,
    className,
}: TradingCoinLogoProps) => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const { cryptoIdToNativeCoinSymbol } = useTradingInfo();
    const networkSymbol = cryptoIdToNativeCoinSymbol(cryptoId);

    return (
        <Wrapper className={className}>
            <AssetLogo
                coingeckoId={networkId}
                contractAddress={getAssetLogoContractAddresses(networkSymbol, contractAddress)}
                size={size}
                placeholder={networkId.toUpperCase()}
                margin={margin}
            />
        </Wrapper>
    );
};
