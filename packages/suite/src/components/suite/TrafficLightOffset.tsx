import React from 'react';

import styled from 'styled-components';

import { zIndices } from '@trezor/theme';
import { isDesktop, isMacOs } from '@trezor/env-utils';

type Props = {
    children?: React.ReactNode;
    offset?: number;
    isVisible?: boolean;
};

const FixForNotBeingAbleToDragWindow = styled.div`
    -webkit-app-region: drag;
    pointer-events: none;
    height: 64px;
    position: fixed;
    z-index: ${zIndices.windowControls};
    top: 0;
    left: 0;
    width: 100%;
`;

const Container = styled.div<{ $offset: number }>`
    ${({ $offset }) => `padding-top: ${$offset}px;`}
    width: 100%;
    height: 100%;
`;

// See: https://github.com/electron/electron/issues/5678
// Visible all the time in the app
export const TrafficLightDraggableWindowHeader = ({ children, isVisible = true }: Props) => {
    const isMac = isMacOs();
    const isDesktopApp = isDesktop();

    if (!isVisible || !isMac || !isDesktopApp) return children;

    return <FixForNotBeingAbleToDragWindow />;
};

// on Mac in desktop app we don't use window bar and close/maximize/minimize icons are positioned directly in the app
export const TrafficLightOffset = ({ children, offset = 35, isVisible = true }: Props) => {
    const isMac = isMacOs();
    const isDesktopApp = isDesktop();

    if (!isVisible || !isMac || !isDesktopApp) return children;

    return <Container $offset={offset}>{children}</Container>;
};
