import { AssetLogo } from '@trezor/components';
import { CoinmarketCoinLogoProps } from 'src/types/coinmarket/coinmarket';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import styled from 'styled-components';

const Wrapper = styled.div``;

export const CoinmarketCoinLogo = ({
    cryptoId,
    size = 24,
    margin,
    className,
}: CoinmarketCoinLogoProps) => {
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
