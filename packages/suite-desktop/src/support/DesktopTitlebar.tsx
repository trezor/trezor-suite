import React, { useEffect, useState } from 'react';
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
    background: ${colors.TYPE_DARK_GREY}; // not using theme on purpose
    color: ${colors.TYPE_LIGHT_GREY};
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

const Action = styled.div<{ isMac?: boolean; isDisabled?: boolean; isActive?: boolean }>`
    box-sizing: border-box;
    width: ${props => (props.isMac ? 12 : TITLEBAR_HEIGHT)}px;
    height: ${props => (props.isMac ? 12 : TITLEBAR_HEIGHT)}px;
    ${props => (props.isMac ? 'margin: 0 8px 0 0;' : 'margin: 0;')}
    ${props => props.isMac && !props.isActive && `border: 1px solid ${colors.TYPE_LIGHT_GREY};`}
    border-radius: ${props => (props.isMac ? 50 : 0)}px;
    background: transparent;
    -webkit-app-region: no-drag;
    display: flex;
    align-content: center;
    align-items: center;
    justify-content: center;
    ${props =>
        !props.isMac &&
        `&:hover {
            background: ${colors.TYPE_LIGHT_GREY};
            & svg {
                fill: ${colors.TYPE_WHITE}
            }
        }`}
`;

const ActionClose = styled(Action)`
    ${props =>
        !props.isMac &&
        `&:hover {
            background: ${colors.TYPE_RED};
        }`}
`;

// ${props => props.isMac && props.isActive && `background: ${colors.TYPE_RED};`}

const ActionMinimize = styled(Action)`
    order: ${props => (props.isMac ? '0' : '1')};
`;

const ActionMaximize = styled(Action)`
    margin-right: 0;
`;

const Actions = styled.div<{ isMac?: boolean; isDisabled?: boolean; isActive?: boolean }>`
    display: inline-flex;
    align-content: center;
    align-items: center;
    height: 100%;
    position: relative;
    z-index: 2;
    ${props => !props.isMac && 'float: right;'}
    flex-direction: ${props => (props.isMac ? 'row' : 'row-reverse')};
    margin: ${props => (props.isMac ? '0 10px' : '0')};
    ${props =>
        props.isMac &&
        props.isActive &&
        `& svg {
            opacity: 0;
        }
        &:hover {
            & svg {
                opacity: 0.8;
            }
        }
        & > ${ActionClose} {
            background: #f85550;
        }
        & > ${ActionMaximize} {
            background: #2dcc4d;
        }
        ${
            !props.isDisabled
                ? `& > ${ActionMinimize} {
                background: #fabe3e;
            }`
                : `& > ${ActionMinimize} {
                border: 1px solid ${colors.TYPE_LIGHT_GREY};
            }`
        }
    `}
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
    const [maximized, setMaximized] = useState(false);
    const [active, setActive] = useState(true);

    useEffect(() => {
        window.desktopApi!.on('window/is-maximized', (payload: boolean) => {
            setMaximized(payload);
        });
        window.desktopApi!.on('window/is-active', (payload: boolean) => {
            setActive(payload);
        });
    }, []);

    const isMac = isMacOS();
    const iconSize = isMac ? 10 : 16;
    const iconColor = isMac ? colors.TYPE_DARK_GREY : colors.TYPE_LIGHT_GREY;
    const isMinimizedDisabled = isMac && maximized;

    return (
        <Titlebar>
            <Drag />
            <Actions isMac={isMac} isDisabled={isMinimizedDisabled} isActive={active}>
                <ActionClose
                    isMac={isMac}
                    isActive={active}
                    onClick={() => window.desktopApi!.windowClose()}
                    data-button="close"
                >
                    <Icon color={iconColor} size={iconSize} icon="WINDOW_CLOSE" />
                </ActionClose>
                <ActionMinimize
                    isMac={isMac}
                    isActive={active}
                    onClick={
                        isMinimizedDisabled ? undefined : () => window.desktopApi!.windowMinimize()
                    }
                    data-button="minimize"
                >
                    <Icon color={iconColor} size={iconSize} icon="WINDOW_MINIMIZE" />
                </ActionMinimize>
                {maximized ? (
                    <ActionMaximize
                        isMac={isMac}
                        isActive={active}
                        onClick={() => window.desktopApi!.windowUnmaximize()}
                        data-button="restore"
                    >
                        <Icon
                            color={iconColor}
                            size={iconSize}
                            icon={isMac ? 'WINDOW_RESTORE_MAC' : 'WINDOW_RESTORE'}
                        />
                    </ActionMaximize>
                ) : (
                    <ActionMaximize
                        isMac={isMac}
                        isActive={active}
                        onClick={() => window.desktopApi!.windowMaximize()}
                        data-button="maximize"
                    >
                        <Icon
                            color={iconColor}
                            size={iconSize}
                            icon={isMac ? 'WINDOW_MAXIMIZE_MAC' : 'WINDOW_MAXIMIZE'}
                        />
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
