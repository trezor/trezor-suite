import { useSelector } from 'react-redux';
import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { useServices } from '@trezor/dependency-injection';
import type { NetworkConfigState, NetworkSymbol } from '@trezor/network-module-types';

import {
    selectIsTestnet,
    selectNetworkConfig,
} from '../../network-display/networkDisplaySelectors';
import { injectGetNetworkIcon, injectHasNetworkIcon } from '../../services/networkServices';
import { TokenInitials } from '../TokenIcon/TokenInitials';

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
    /** Source of the fallback initials for networks without a bundled icon, such as custom networks. */
    networkName?: string;
    size?: NetworkIconSize;
    'data-testid'?: string;
}

export function NetworkIcon({
    networkSymbol,
    networkName,
    size = 32,
    'data-testid': dataTestId,
}: NetworkIconProps) {
    const { getNetworkIcon, hasNetworkIcon } = useServices(
        injectGetNetworkIcon,
        injectHasNetworkIcon,
    );
    const isTestnet = useSelector((state: NetworkConfigState) =>
        selectIsTestnet(state, networkSymbol),
    );

    const configName = useSelector(
        (state: NetworkConfigState) => selectNetworkConfig(state, networkSymbol)?.name,
    );

    const src = hasNetworkIcon(networkSymbol) ? getNetworkIcon(networkSymbol) : undefined;

    if (typeof src !== 'string' || !src) {
        return (
            <TokenInitials size={size} withTooltip={false}>
                {networkName ?? configName ?? networkSymbol}
            </TokenInitials>
        );
    }

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
