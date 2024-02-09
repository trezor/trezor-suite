import { Elevation, mapElevationToBackground } from '@trezor/theme';
import styled from 'styled-components';
import { useElevation } from '../ElevationContext/ElevationContext';

export interface GradientOverlayProps {
    hiddenFrom?: string;
    forcedElevation?: Elevation;
}

export const Gradient = styled.div<{
    elevation: Elevation;
    hiddenFrom?: GradientOverlayProps['hiddenFrom'];
}>`
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        to right,
        rgb(0 0 0 / 0%) 0%,
        ${({ hiddenFrom, ...props }) => `${mapElevationToBackground(props)} ${hiddenFrom}`}
    );
`;

export const GradientOverlay = ({ hiddenFrom = '50%', forcedElevation }: GradientOverlayProps) => {
    const { parentElevation } = useElevation(forcedElevation);

    return (
        <Gradient
            elevation={forcedElevation === undefined ? parentElevation : forcedElevation}
            hiddenFrom={hiddenFrom}
        />
    );
};
