import styled from 'styled-components';

import { parseCryptoId, useTradingInfo } from '@suite-common/trading';
import { AssetLogo } from '@trezor/product-components';

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
        <Wrapper
            // eslint-disable-next-line local-rules/no-classname-on-component
            className={className}
        >
            <AssetLogo
                coingeckoId={networkId}
                symbol={networkSymbol}
                contractAddress={contractAddress}
                size={size}
                placeholder={networkId.toUpperCase()}
                margin={margin}
            />
        </Wrapper>
    );
};
