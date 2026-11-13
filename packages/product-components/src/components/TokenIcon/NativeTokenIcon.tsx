import styled from 'styled-components';

import { useServices } from '@trezor/dependency-injection';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { type TokenIconSize } from './tokenIconTypes';
import { injectGetCryptoIcon } from '../../services/networkServices';

// The coin SVGs are multi-colour and never restyled from CSS, so they need no inline injection.
const Logo = styled.img<{ $size: TokenIconSize }>`
    display: block;
    flex-shrink: 0;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

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
    const src = getCryptoIcon(symbol);

    if (typeof src !== 'string' || !src) return null;

    return (
        <Logo
            src={src}
            alt=""
            width={size}
            height={size}
            decoding="async"
            $size={size}
            data-testid={dataTestId}
        />
    );
};
