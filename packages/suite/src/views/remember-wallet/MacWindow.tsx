import { ElevationContext, useElevation } from '@trezor/components';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';
import { ReactNode } from 'react';
import styled from 'styled-components';

const Window = styled.div<{ $elevation: Elevation }>`
    width: 258px;
    height: 184px;
    border: 1px solid ${mapElevationToBorder};
    background-color: ${mapElevationToBackground};
    border-bottom: 0;
    border-top-left-radius: ${borders.radii.sm};
    border-top-right-radius: ${borders.radii.sm};
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
