import styled from 'styled-components';

import type { SuiteThemeColors } from '@trezor/components';
import { variables } from '@trezor/components';
import { hexToRgba } from '@trezor/utils';

export const TopBar = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 24px;
    background: ${({ theme }) => hexToRgba(theme.surfaceFillPage, 0.8)};
    box-shadow: ${({ theme }) => theme.boxShadowBase};

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        backdrop-filter: blur(20px);
    }
`;

export const MainWithSidebar = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: column;
    }
`;

export const ContentArea = styled.div`
    flex: 1;
    min-width: 0;
    padding: 20px 10px;
    overflow-y: auto;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        order: 1;
    }

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        padding: 20px;
    }
`;

export const SidebarOuter = styled.div<{ theme: SuiteThemeColors }>`
    margin-left: 8px;

    @media (min-width: ${variables.SCREEN_SIZE.MD}) {
        display: flex;
        flex-direction: column;
        height: 100%;
        z-index: 10;
    }
`;

export const EventCardWrapper = styled.div`
    border-radius: 18px;
    border: 2px solid transparent;
    transition: border-color 0.4s ease-out;

    &.highlighted {
        border-color: ${({ theme }) => theme.legacyBackgroundAlertYellowBold};
    }
`;
