import { useRef } from 'react';
import { useDispatch } from 'react-redux';

import styled, { css } from 'styled-components';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { Box, Icon, Row, ShortcutBadge, TOOLTIP_DELAY_LONG, Tooltip } from '@trezor/components';
import { commonFocusStyles, focusStyleTransition } from '@trezor/components/src/utils/utils';
import { CaretCircleDownIcon } from '@trezor/icons';
import { zIndices } from '@trezor/theme';

import { setRecentlyConnectedDevicePath } from 'src/actions/suite/suiteActions';
import { openSwitchDeviceDialog } from 'src/actions/wallet/addWalletThunk';
import { useSelector } from 'src/hooks/suite';
import { selectRecentlyConnectedDevice } from 'src/selectors/suite/suiteSelectors';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { SidebarDeviceStatus } from './SidebarDeviceStatus';
import { ExpandedSidebarOnly } from '../Sidebar/ExpandedSidebarOnly';

const CaretContainer = styled.div`
    background: transparent;
    padding: 10px;
    border-radius: 50%;
    transition: background 0.15s;
    flex-shrink: 0;
`;

const Wrapper = styled.div<{ $isSidebarCollapsed?: boolean }>`
    width: 100%;
    padding: 16px;
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

const InnerContainer = styled.div<{ $isDisabled?: boolean }>`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 42px;
    -webkit-app-region: no-drag;

    cursor: ${({ $isDisabled }) => ($isDisabled ? 'not-allowed' : 'pointer')};
`;

const RecentlyConnectedDeviceTooltipContent = () => {
    const dispatch = useDispatch();

    const recentlyConnectedDevice = useSelector(selectRecentlyConnectedDevice);
    // deviceName must stay at initial value to prevent flickering, because the tooltip disappearing animation takes some time.
    const deviceNameRef = useRef(recentlyConnectedDevice?.name);
    if (deviceNameRef.current === undefined) return null;

    const handleClick = () => {
        dispatch(openSwitchDeviceDialog());
        dispatch(setRecentlyConnectedDevicePath(null));
    };

    return (
        <Box onClick={handleClick}>
            {deviceNameRef.current} <Translation id="TR_CONNECTED" />
        </Box>
    );
};

export const DeviceSelector = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const recentlyConnectedDevice = useSelector(selectRecentlyConnectedDevice);
    const dispatch = useDispatch();

    const handleSwitchDeviceClick = () => {
        dispatch(openSwitchDeviceDialog());
        dispatch(setRecentlyConnectedDevicePath(null));
    };

    const { isSidebarCollapsed } = useResponsiveContext();

    return (
        <Tooltip
            isOpen={recentlyConnectedDevice !== undefined}
            content={<RecentlyConnectedDeviceTooltipContent />}
            placement="right"
            zIndex={zIndices.popover /* to prevent it from appearing above modals */}
        >
            <Wrapper $isSidebarCollapsed={isSidebarCollapsed}>
                {/* The shortcut hint is shown only in the expanded sidebar; when collapsed,
                    DeviceStatus renders its own tooltip with the device detail and shortcut. */}
                <Tooltip
                    cursor="pointer"
                    width="100%"
                    isActive={!isSidebarCollapsed}
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
                        onClick={handleSwitchDeviceClick}
                        tabIndex={0}
                        data-testid="@menu/switch-device"
                    >
                        <Box flex="1" minWidth="0" overflow="hidden">
                            <SidebarDeviceStatus />
                        </Box>

                        <ExpandedSidebarOnly>
                            {selectedDevice?.state && (
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
