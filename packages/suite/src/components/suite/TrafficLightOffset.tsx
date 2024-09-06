import { isDesktop, isMacOs } from '@trezor/env-utils';
import React from 'react';
import styled from 'styled-components';
import { zIndices } from '@trezor/theme/libDev/src';

type Props = {
    children?: React.ReactNode;
    offset?: number;
    isVisible?: boolean;
};

// See: https://github.com/electron/electron/issues/5678
// Visible all the time in the app
const ThinFixForNotBeingAbleToDragWindow = styled.div`
    -webkit-app-region: drag;
    height: 12px;
    position: fixed;
    z-index: ${zIndices.windowControls};
    top: 0;
    left: 0;
    width: 100%;
`;

// Visible below content (but visible in the sidebar)
const ThickFixForNotBeingAbleToDragWindow = styled(ThinFixForNotBeingAbleToDragWindow)`
    height: 35px;
    z-index: unset;
`;

const Container = styled.div<{ $hasTopPadding?: boolean; $offset: number }>`
    ${({ $hasTopPadding, $offset }) => $hasTopPadding && `padding-top: ${$offset}px;`}
    width: 100%;
    height: 100%;
`;

// on Mac in desktop app we don't use window bar and close/maximize/minimize icons are positioned directly in the app
export const TrafficLightOffset = ({ children, offset = 35, isVisible = true }: Props) => {
    const isMac = isMacOs();
    const isDesktopApp = isDesktop();

    if (!isVisible) return children;

    return (
        <>
            <ThinFixForNotBeingAbleToDragWindow />
            <ThickFixForNotBeingAbleToDragWindow />
            <Container $hasTopPadding={isMac && isDesktopApp} $offset={offset}>
                {children}
            </Container>
        </>
    );
};
