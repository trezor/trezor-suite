import styled from 'styled-components';

import { cryptoIdToNetworkSymbol, parseCryptoId } from '@suite-common/trading';
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
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const networkSymbol = cryptoIdToNetworkSymbol(cryptoId);

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
