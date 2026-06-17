import { type ReactNode } from 'react';

import styled from 'styled-components';

import { variables } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';

const MAC_WINDOW_HEIGHT = '184px';

const Window = styled.div`
    min-width: 258px;
    height: ${MAC_WINDOW_HEIGHT};
    border: 1px solid ${({ theme }) => theme.surfaceBorderModeless};
    background-color: ${({ theme }) => theme.surfaceFillModeless};
    border-bottom: 0;
    border-radius: ${borders.radii.sm} ${borders.radii.sm} 0 0;
    flex: 1 1 auto;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        height: calc(${MAC_WINDOW_HEIGHT} + ${spacingsPx.md});
        border-radius: ${borders.radii.sm};
        padding-bottom: ${spacingsPx.md};
    }
`;

const WindowBar = styled.div`
    height: 22px;
    border-bottom: 1px solid ${({ theme }) => theme.surfaceBorderModeless};
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

const WindowBullet = styled.div`
    background-color: ${({ theme }) => theme.surfaceBorderModeless};
    border-radius: 100%;
    width: 7px;
    height: 7px;
`;

export const MacWindow = ({ children }: { children: ReactNode }) => (
    <Window>
        <WindowBar>
            <WindowBarBullets>
                <WindowBullet />
                <WindowBullet />
                <WindowBullet />
            </WindowBarBullets>
        </WindowBar>
        {children}
    </Window>
);
