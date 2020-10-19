import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import NoSSR from '@suite-support/NoSSR';
import { colors, TrezorLogo, Icon } from '@trezor/components';
import { isMac as isMacOS } from '@suite-utils/env';

const TITLEBAR_HEIGHT = 40;
const RESIZE_HANDLER_PADDING = 4;

const Titlebar = styled.div`
    display: block;
    height: ${TITLEBAR_HEIGHT}px;
    width: 100%;
    position: fixed;
    z-index: 1000000;
    position: relative;
    background: ${colors.NEUE_TYPE_DARK_GREY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};

    &:after {
        position: fixed;
        width: calc(100% - ${RESIZE_HANDLER_PADDING * 2}px);
        height: ${TITLEBAR_HEIGHT - RESIZE_HANDLER_PADDING}px;
        content: '';
        display: block;
        top: ${RESIZE_HANDLER_PADDING}px;
        left: ${RESIZE_HANDLER_PADDING}px;
        z-index: 0;
        -webkit-user-select: none;
        -webkit-app-region: drag;
    }
`;

const Actions = styled.div<{ isMac?: boolean }>`
    display: flex;
    align-content: center;
    align-items: center;
    margin: 0 18px;
    height: 100%;
    position: relative;
    z-index: 2;
    flex-direction: ${props => (props.isMac === true ? 'row' : 'row-reverse')};
`;

const Action = styled.div<{ isMac?: boolean }>`
    width: 12px;
    height: 12px;
    border-radius: 12px;
    background: transparent;
    margin: ${props => (props.isMac === true ? '0 8px 0 0' : '0 0 0 16px')};
    -webkit-app-region: no-drag;
    display: flex;
    align-content: center;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    & > * {
        cursor: pointer;
    }
`;

const ActionClose = styled(Action)`
    background: ${props => (props.isMac === true ? '#f85550' : 'transparent')};
`;

const ActionMinimize = styled(Action)`
    background: ${props => (props.isMac === true ? '#fabe3e' : 'transparent')};
    order: ${props => (props.isMac === true ? '0' : '1')};
`;

const ActionMaximize = styled(Action)`
    background: ${props => (props.isMac === true ? '#2dcc4d' : 'transparent')};
`;

const LogoWrapper = styled.div`
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    display: flex;
    width: 100%;
    height: 100%;
    align-content: center;
    align-items: center;
    justify-content: center;
    opacity: 69%;
`;

const close = () => {
    window.desktopApi!.windowClose();
};
const minimize = () => {
    window.desktopApi!.windowMinimize();
};
const maximize = () => {
    window.desktopApi!.windowMaximize();
};
const restore = () => {
    window.desktopApi!.windowUnmaximize();
};

const DesktopTitlebar = () => {
    const [maximized, setMaximized] = useState(false);
    useEffect(() => {
        window.desktopApi!.on('window/is-maximized', (payload: boolean) => {
            setMaximized(payload);
        });
    }, []);
    const isMac = isMacOS();
    const iconSize = isMac ? 8 : 16;
    const iconColor = isMac ? colors.NEUE_TYPE_DARK_GREY : colors.NEUE_TYPE_LIGHT_GREY;
    return (
        <Titlebar>
            <Actions isMac={isMac}>
                <ActionClose isMac={isMac} onClick={close}>
                    <Icon color={iconColor} size={iconSize} icon="WINDOW_CLOSE" />
                </ActionClose>
                <ActionMinimize isMac={isMac} onClick={minimize}>
                    <Icon color={iconColor} size={iconSize} icon="WINDOW_MINIMIZE" />
                </ActionMinimize>
                {maximized && (
                    <ActionMaximize isMac={isMac} onClick={restore}>
                        <Icon color={iconColor} size={iconSize} icon="WINDOW_RESTORE" />
                    </ActionMaximize>
                )}
                {!maximized && (
                    <ActionMaximize isMac={isMac} onClick={maximize}>
                        <Icon color={iconColor} size={iconSize} icon="WINDOW_MAXIMIZE" />
                    </ActionMaximize>
                )}
            </Actions>
            <LogoWrapper>
                <TrezorLogo
                    type="suite_compact"
                    variant="white"
                    width="48px"
                    data-test="trezor-suite-compact-logo-black"
                />
            </LogoWrapper>
        </Titlebar>
    );
};

interface Props {
    children: React.ReactNode;
}

const DesktopTitlebarWrapper = (props: Props) => {
    return (
        <>
            <NoSSR>
                <DesktopTitlebar />
            </NoSSR>
            {props.children}
        </>
    );
};

export default DesktopTitlebarWrapper;
