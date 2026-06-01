import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import {
    type NetworkIconSymbol,
    getNetworkIconName,
    isNetworkIconSymbol,
    isTestnetNetworkIconSymbol,
    networkIcons,
} from '@suite-common/icons';

const IconWrapper = styled.div<{ $size: number; $isTestnet: boolean }>`
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
    networkSymbol: NetworkIconSymbol;
    size?: number;
}

export function NetworkIcon({ networkSymbol, size = 32 }: NetworkIconProps) {
    if (!isNetworkIconSymbol(networkSymbol)) {
        console.error(`Network icon for ${networkSymbol} not found`);

        return null;
    }

    const iconName = getNetworkIconName(networkSymbol);
    const isTestnet = isTestnetNetworkIconSymbol(networkSymbol);

    return (
        <IconWrapper $size={size} $isTestnet={isTestnet}>
            <StyledReactSVG
                src={networkIcons[iconName]}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                }}
                loading={() => <span className="loading" />}
            />
        </IconWrapper>
    );
}
