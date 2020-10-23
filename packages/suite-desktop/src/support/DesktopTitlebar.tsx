import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import NoSSR from '@suite-support/NoSSR';
import { colors, TrezorLogo, Icon } from '@trezor/components';
import { isMac as isMacOS } from '@suite-utils/env';

const TITLEBAR_HEIGHT = 28;
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
`;

const Drag = styled.div`
    position: fixed;
    width: calc(100% - ${RESIZE_HANDLER_PADDING * 2}px);
    height: ${TITLEBAR_HEIGHT - RESIZE_HANDLER_PADDING}px;
    content: '';
    display: block;
    top: ${RESIZE_HANDLER_PADDING}px;
    left: ${RESIZE_HANDLER_PADDING}px;
    -webkit-user-select: none;
    -webkit-app-region: drag;
`;

const Actions = styled.div<{ isMac?: boolean }>`
    display: flex;
    align-content: center;
    align-items: center;
    height: 100%;
    position: relative;
    z-index: 2;
    flex-direction: ${props => (props.isMac ? 'row' : 'row-reverse')};
    margin: ${props => (props.isMac ? '0 10px' : '0')};
`;

const Action = styled.div<{ isMac?: boolean }>`
    width: ${props => (props.isMac ? 14 : TITLEBAR_HEIGHT)}px;
    height: ${props => (props.isMac ? 14 : TITLEBAR_HEIGHT)}px;
    margin: ${props => (props.isMac ? 2 : 0)}px;
    border-radius: ${props => (props.isMac ? 50 : 0)}px;
    background: transparent;
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
    background: ${props => (props.isMac ? '#f85550' : 'transparent')};

    &:hover {
        background: ${props => (props.isMac ? '#f85550' : colors.NEUE_TYPE_RED)};
    }
`;

const ActionMinimize = styled(Action)`
    background: ${props => (props.isMac ? '#fabe3e' : 'transparent')};
    order: ${props => (props.isMac ? '0' : '1')};

    &:hover {
        background: ${props => (props.isMac ? '#fabe3e' : colors.NEUE_TYPE_LIGHT_GREY)};
    }
`;

const ActionMaximize = styled(Action)`
    background: ${props => (props.isMac ? '#2dcc4d' : 'transparent')};

    &:hover {
        background: ${props => (props.isMac ? '#2dcc4d' : colors.NEUE_TYPE_LIGHT_GREY)};
    }
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

const DesktopTitlebar = () => {
    const [hover, setHover] = useState('');
    const [maximized, setMaximized] = useState(false);

    useEffect(() => {
        window.desktopApi!.on('window/is-maximized', (payload: boolean) => {
            setMaximized(payload);
        });
    }, []);

    const mouseEnter = useCallback(
        ({ currentTarget }) => {
            setHover(currentTarget.getAttribute('data-button'));
        },
        [setHover],
    );

    const mouseLeave = useCallback(() => {
        setHover('');
    }, [setHover]);

    const isMac = isMacOS();
    const iconSize = isMac ? 10 : 16;
    const iconColor = isMac ? colors.NEUE_TYPE_DARK_GREY : colors.NEUE_TYPE_LIGHT_GREY;
    const isMacNotHovering = !isMac || hover !== '';
    const isNotMacHovering = (btn: string) => !isMac && hover === btn;

    return (
        <Titlebar>
            <Drag />
            <Actions isMac={isMac}>
                <ActionClose
                    isMac={isMac}
                    onClick={() => window.desktopApi!.windowClose()}
                    data-button="close"
                    onMouseEnter={mouseEnter}
                    onMouseLeave={mouseLeave}
                >
                    {isMacNotHovering && (
                        <Icon
                            color={isNotMacHovering('close') ? colors.WHITE : iconColor}
                            size={iconSize}
                            icon="WINDOW_CLOSE"
                        />
                    )}
                </ActionClose>
                <ActionMinimize
                    isMac={isMac}
                    onClick={() => window.desktopApi!.windowMinimize()}
                    data-button="minimize"
                    onMouseEnter={mouseEnter}
                    onMouseLeave={mouseLeave}
                >
                    {isMacNotHovering && (
                        <Icon
                            color={isNotMacHovering('minimize') ? colors.WHITE : iconColor}
                            size={iconSize}
                            icon="WINDOW_MINIMIZE"
                        />
                    )}
                </ActionMinimize>
                {maximized ? (
                    <ActionMaximize
                        isMac={isMac}
                        onClick={() => window.desktopApi!.windowUnmaximize()}
                        data-button="restore"
                        onMouseEnter={mouseEnter}
                        onMouseLeave={mouseLeave}
                    >
                        {isMacNotHovering && (
                            <Icon
                                color={isNotMacHovering('restore') ? colors.WHITE : iconColor}
                                size={iconSize}
                                icon="WINDOW_RESTORE"
                            />
                        )}
                    </ActionMaximize>
                ) : (
                    <ActionMaximize
                        isMac={isMac}
                        onClick={() => window.desktopApi!.windowMaximize()}
                        data-button="maximize"
                        onMouseEnter={mouseEnter}
                        onMouseLeave={mouseLeave}
                    >
                        {isMacNotHovering && (
                            <Icon
                                color={isNotMacHovering('maximize') ? colors.WHITE : iconColor}
                                size={iconSize}
                                icon="WINDOW_MAXIMIZE"
                            />
                        )}
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
