import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

export const allowedNetworkIconSizes = [8, 12, 16, 20, 24, 32, 40, 48, 64] as const;
export type NetworkIconSize = (typeof allowedNetworkIconSizes)[number];

const IconWrapper = styled.div<{
    $size: NetworkIconSize;
    $color: string;
    $backgroundColor: string;
}>`
    display: flex;
    flex-shrink: 0;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    overflow: hidden;
    border-radius: 25%;
    background: ${({ $backgroundColor }) => $backgroundColor};
    color: ${({ $color }) => $color};
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
    src: string;
    color: string;
    backgroundColor: string;
    size?: NetworkIconSize;
    'data-testid'?: string;
}

export function NetworkIcon({
    src,
    color,
    backgroundColor,
    size = 32,
    'data-testid': dataTestId,
}: NetworkIconProps) {
    return (
        <IconWrapper
            $size={size}
            $color={color}
            $backgroundColor={backgroundColor}
            data-testid={dataTestId}
        >
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
