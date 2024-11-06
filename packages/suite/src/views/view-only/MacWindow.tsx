import { ReactNode } from 'react';

import styled from 'styled-components';

import { ElevationContext, useElevation, variables } from '@trezor/components';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

const MAC_WINDOW_HEIGHT = '184px';

const Window = styled.div<{ $elevation: Elevation }>`
    min-width: 258px;
    height: ${MAC_WINDOW_HEIGHT};
    border: 1px solid ${mapElevationToBorder};
    background-color: ${mapElevationToBackground};
    border-bottom: 0;
    border-radius: ${borders.radii.sm} ${borders.radii.sm} 0 0;
    flex: 1 1 auto;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        height: calc(${MAC_WINDOW_HEIGHT} + ${spacingsPx.md});
        border-radius: ${borders.radii.sm};
        padding-bottom: ${spacingsPx.md};
    }
`;

const WindowBar = styled.div<{ $elevation: Elevation }>`
    height: 22px;
    border-bottom: 1px solid ${mapElevationToBorder};
`;

const WindowBarBullets = styled.div`
    height: 100%;
    display: flex;
    flex-direction: row;
    gap: ${spacingsPx.xxs};
    justify-content: start;
    align-items: center;
    margin-left: ${spacingsPx.xs};
`;

const WindowBullet = styled.div<{ $elevation: Elevation }>`
    background-color: ${mapElevationToBorder};
    border-radius: 100%;
    width: 7px;
    height: 7px;
`;

export const MacWindow = ({ children }: { children: ReactNode }) => {
    const { elevation } = useElevation();

    return (
        <Window $elevation={elevation}>
            <WindowBar $elevation={elevation}>
                <WindowBarBullets>
                    <WindowBullet $elevation={elevation} />
                    <WindowBullet $elevation={elevation} />
                    <WindowBullet $elevation={elevation} />
                </WindowBarBullets>
            </WindowBar>
            <ElevationContext baseElevation={elevation}>{children}</ElevationContext>
        </Window>
    );
};
