import { useSelector } from 'react-redux';
import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { useServices } from '@trezor/dependency-injection';
import type { NetworkConfigState, NetworkSymbol } from '@trezor/network-module-types';

import { TokenInitials } from './TokenInitials';
import { type TokenIconSize } from './tokenIconTypes';
import { selectNetworkConfig } from '../../network-display/networkDisplaySelectors';
import { injectGetCryptoIcon } from '../../services/networkServices';

const SvgContainer = styled.div<{ $size: TokenIconSize }>`
    display: flex;
    flex-shrink: 0;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

const StyledReactSVG = styled(ReactSVG)`
    display: flex;
    width: 100%;
    height: 100%;

    div {
        display: flex;
        width: 100%;
        height: 100%;
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
    }
` as typeof ReactSVG;

type NativeTokenIconProps = {
    symbol: NetworkSymbol;
    size?: TokenIconSize;
    'data-testid'?: string;
};

export const NativeTokenIcon = ({
    symbol,
    size = 32,
    'data-testid': dataTestId,
}: NativeTokenIconProps) => {
    const { getCryptoIcon } = useServices(injectGetCryptoIcon);
    const displaySymbol = useSelector(
        (state: NetworkConfigState) => selectNetworkConfig(state, symbol)?.displaySymbol,
    );
    const src = getCryptoIcon(symbol);

    if (typeof src !== 'string' || !src) {
        return (
            <TokenInitials size={size} withTooltip={false}>
                {displaySymbol ?? symbol}
            </TokenInitials>
        );
    }

    return (
        <SvgContainer $size={size} data-testid={dataTestId}>
            <StyledReactSVG
                src={src}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                }}
                loading={() => <span className="loading" />}
            />
        </SvgContainer>
    );
};
