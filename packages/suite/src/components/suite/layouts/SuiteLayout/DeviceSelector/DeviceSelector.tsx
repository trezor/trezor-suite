import { useRef } from 'react';

import styled, { css } from 'styled-components';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { Box, Icon, Row, ShortcutBadge, TOOLTIP_DELAY_LONG, Tooltip } from '@trezor/components';
import { commonFocusStyles, focusStyleTransition } from '@trezor/components/src/utils/utils';
import { useServices } from '@trezor/dependency-injection';
import { CaretCircleDownIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { zIndices } from '@trezor/theme';

import { setRecentlyConnectedDevicePath } from '#src/actions/suite/suiteActions';
import { openSwitchDeviceDialogThunk } from '#src/actions/wallet/addWalletThunk';
import { useSelector } from '#src/hooks/suite/useSelector';
import { selectRecentlyConnectedDevice } from '#src/selectors/suite/suiteSelectors';
import { useResponsiveContext } from '#src/support/suite/ResponsiveContext';

import { SidebarDeviceStatus } from './SidebarDeviceStatus';
import { ExpandedSidebarOnly } from '../Sidebar/ExpandedSidebarOnly';

const DEVICE_SELECTOR_PADDING = 16;
const DEVICE_SELECTOR_CONTENT_MIN_HEIGHT = 42;

export const DEVICE_SELECTOR_HEIGHT =
    DEVICE_SELECTOR_PADDING * 2 + DEVICE_SELECTOR_CONTENT_MIN_HEIGHT;

const CaretContainer = styled.div`
    background: transparent;
    padding: 10px;
    border-radius: 50%;
    transition: background 0.15s;
    flex-shrink: 0;
`;

const Wrapper = styled.div<{ $isSidebarCollapsed?: boolean }>`
    width: 100%;
    padding: ${DEVICE_SELECTOR_PADDING}px;
    align-items: center;
    border-radius: 12px;
    transition: ${focusStyleTransition};
    white-space: nowrap;
    ${({ $isSidebarCollapsed }) =>
        $isSidebarCollapsed &&
        css`
            display: flex;
            justify-content: center;
        `}

    &:focus-visible {
        ${commonFocusStyles}
    }

    &:hover {
        ${CaretContainer} {
            background: ${({ theme }) => theme.elementFillGhostPressed};
        }
    }
`;

const InnerContainer = styled.div<{ $isInteractive: boolean }>`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: ${DEVICE_SELECTOR_CONTENT_MIN_HEIGHT}px;
    -webkit-app-region: no-drag;

    cursor: ${({ $isInteractive }) => ($isInteractive ? 'pointer' : 'default')};
`;

const RecentlyConnectedDeviceTooltipContent = () => {
    const { dispatch } = useServices(injectDispatch);

    const recentlyConnectedDevice = useSelector(selectRecentlyConnectedDevice);
    // deviceName must stay at initial value to prevent flickering, because the tooltip disappearing animation takes some time.
    const deviceNameRef = useRef(recentlyConnectedDevice?.name);
    if (deviceNameRef.current === undefined) return null;

    const handleClick = () => {
        dispatch(openSwitchDeviceDialogThunk());
        dispatch(setRecentlyConnectedDevicePath(null));
    };

    return (
        <Box onClick={handleClick}>
            {deviceNameRef.current} <Translation id="TR_CONNECTED" />
        </Box>
    );
};

type DeviceSelectorProps = {
    isInteractive?: boolean;
};

export const DeviceSelector = ({ isInteractive = true }: DeviceSelectorProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const recentlyConnectedDevice = useSelector(selectRecentlyConnectedDevice);
    const { dispatch } = useServices(injectDispatch);

    const handleSwitchDeviceClick = () => {
        dispatch(openSwitchDeviceDialogThunk());
        dispatch(setRecentlyConnectedDevicePath(null));
    };

    const { isSidebarCollapsed } = useResponsiveContext();

    return (
        <Tooltip
            isOpen={isInteractive && recentlyConnectedDevice !== undefined}
            isActive={isInteractive}
            content={<RecentlyConnectedDeviceTooltipContent />}
            placement="right"
            zIndex={zIndices.popover /* to prevent it from appearing above modals */}
        >
            <Wrapper $isSidebarCollapsed={isSidebarCollapsed}>
                {/* The shortcut hint is shown only in the expanded sidebar; when collapsed,
                    DeviceStatus renders its own tooltip with the device detail and shortcut. */}
                <Tooltip
                    cursor={isInteractive ? 'pointer' : 'default'}
                    width="100%"
                    isActive={isInteractive && !isSidebarCollapsed}
                    delayShow={TOOLTIP_DELAY_LONG}
                    placement="right"
                    content={
                        <Row gap={12} alignItems="center">
                            <Translation id="TR_GUIDE_KEYBOARD_SHORTCUTS_SWITCH_DEVICE" />
                            <ShortcutBadge shortcut={['ALT', 'KEY_W']} />
                        </Row>
                    }
                >
                    <InnerContainer
                        $isInteractive={isInteractive}
                        onClick={isInteractive ? handleSwitchDeviceClick : undefined}
                        tabIndex={isInteractive ? 0 : undefined}
                        data-testid="@menu/switch-device"
                    >
                        <Box flex="1" minWidth="0" overflow="hidden">
                            <SidebarDeviceStatus isSwitchShortcutVisible={isInteractive} />
                        </Box>

                        <ExpandedSidebarOnly>
                            {isInteractive && selectedDevice?.state && (
                                <CaretContainer>
                                    <Icon size={20} as={CaretCircleDownIcon} />
                                </CaretContainer>
                            )}
                        </ExpandedSidebarOnly>
                    </InnerContainer>
                </Tooltip>
            </Wrapper>
        </Tooltip>
    );
};
