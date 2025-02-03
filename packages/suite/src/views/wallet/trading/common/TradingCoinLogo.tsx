import styled from 'styled-components';

import { parseCryptoId } from '@suite-common/trading';
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
