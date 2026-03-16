import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type LegacyNetworkSymbol, NETWORK_ICONS } from '../../constants/networks';

const StyledReactSVG = styled(ReactSVG)`
    line-height: 0;
` as typeof ReactSVG;

export interface NetworkIconProps {
    networkSymbol: NetworkSymbol | LegacyNetworkSymbol;
    size?: number;
    className?: string;
}

export function NetworkIcon({ networkSymbol, size = 32, className }: NetworkIconProps) {
    const src = NETWORK_ICONS[networkSymbol];

    if (!src) {
        console.error(`Network icon for ${networkSymbol} not found`);

        return null;
    }

    return (
        <StyledReactSVG
            src={NETWORK_ICONS[networkSymbol]}
            beforeInjection={svg => {
                svg.setAttribute('width', `${size}px`);
                svg.setAttribute('height', `${size}px`);
            }}
            loading={() => <span className="loading" />}
            className={className}
        />
    );
}
