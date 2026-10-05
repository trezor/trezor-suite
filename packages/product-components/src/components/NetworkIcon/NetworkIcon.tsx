import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { useServices } from '@trezor/dependency-injection';
import type { NetworkSymbol } from '@trezor/network-module-types';

import {
    injectGetNetworkIcon,
    injectHasNetworkIcon,
    injectIsTestnetNetworkIcon,
} from '../../services/networkServices';

export const allowedNetworkIconSizes = [8, 12, 16, 20, 24, 32, 40, 48, 64] as const;
export type NetworkIconSize = (typeof allowedNetworkIconSizes)[number];

const IconWrapper = styled.div<{ $size: NetworkIconSize; $isTestnet: boolean }>`
    display: flex;
    flex-shrink: 0;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    overflow: hidden;
    border-radius: 25%;
    background: ${({ $isTestnet, theme }) =>
        $isTestnet ? theme.elementFillCriticalBold : theme.elementFillContrast};
    color: ${({ $isTestnet, theme }) =>
        $isTestnet ? theme.contentOnDarkPrimary : theme.contentPrimaryInverse};
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

export interface NetworkIconProps {
    networkSymbol: NetworkSymbol;
    size?: NetworkIconSize;
    'data-testid'?: string;
}

export function NetworkIcon({
    networkSymbol,
    size = 32,
    'data-testid': dataTestId,
}: NetworkIconProps) {
    const { getNetworkIcon, hasNetworkIcon, isTestnetNetworkIcon } = useServices(
        injectGetNetworkIcon,
        injectHasNetworkIcon,
        injectIsTestnetNetworkIcon,
    );

    const src = getNetworkIcon(networkSymbol);

    if (!hasNetworkIcon(networkSymbol) || !src) {
        console.error(`Network icon for ${networkSymbol} not found`);

        return null;
    }

    const isTestnet = isTestnetNetworkIcon(networkSymbol);

    return (
        <IconWrapper $size={size} $isTestnet={isTestnet} data-testid={dataTestId}>
            <StyledReactSVG
                src={src}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                }}
                loading={() => <span className="loading" />}
            />
        </IconWrapper>
    );
}
