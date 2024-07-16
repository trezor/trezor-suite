import { isDesktop, isMacOs } from '@trezor/env-utils';
import React from 'react';
import styled from 'styled-components';

type Props = {
    children?: React.ReactNode;
    offset?: number;
};

// this element fixes not being able to drag window: https://github.com/electron/electron/issues/5678
const WindowAppHandler = styled.div`
    -webkit-app-region: drag;
    height: 12px;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
`;

const Container = styled.div<{ $hasTopPadding?: boolean; $offset: number }>`
    ${({ $hasTopPadding, $offset }) => $hasTopPadding && `padding-top: ${$offset}px;`}
    width: 100%;
    height: 100%;
`;

// on Mac in desktop app we don't use window bar and close/maximize/minimize icons are positioned directly in the app
export const TrafficLightOffset = ({ children, offset = 35 }: Props) => {
    const isMac = isMacOs();
    const isDesktopApp = isDesktop();

    return (
        <>
            <WindowAppHandler />
            <Container $hasTopPadding={isMac && isDesktopApp} $offset={offset}>
                {children}
            </Container>
        </>
    );
};
