import { useRef } from 'react';

import styled, { css } from 'styled-components';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { Box, Icon, Tooltip } from '@trezor/components';
import { focusStyleTransition, getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { borders, spacingsPx, zIndices } from '@trezor/theme';

import { setRecentlyConnectedDevicePath } from 'src/actions/suite/suiteActions';
import { openSwitchDeviceDialog } from 'src/actions/wallet/addWalletThunk';
import { useDispatch, useSelector } from 'src/hooks/suite';
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
    padding: ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.md};
    align-items: center;
    border-radius: ${borders.radii.sm};
    transition: ${focusStyleTransition};
    white-space: nowrap;
    ${({ $isSidebarCollapsed }) =>
        $isSidebarCollapsed &&
        css`
            display: flex;
            justify-content: center;
        `}

    ${getFocusShadowStyle()};

    &:hover {
        ${CaretContainer} {
            background: ${({ theme }) => theme.legacyBackgroundTertiaryPressedOnElevation0};
        }
    }
`;

const InnerContainer = styled.div<{ $isDisabled?: boolean }>`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: ${spacingsPx.md};
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
            placement="right-end"
            zIndex={zIndices.popover /* to prevent it from appearing above modals */}
        >
            <Wrapper $isSidebarCollapsed={isSidebarCollapsed}>
                <InnerContainer
                    onClick={handleSwitchDeviceClick}
                    tabIndex={0}
                    data-testid="@menu/switch-device"
                >
                    <Box flex="1" minWidth="0" overflow="hidden">
                        <SidebarDeviceStatus />
                    </Box>

                    <ExpandedSidebarOnly>
                        {selectedDevice && selectedDevice.state && (
                            <CaretContainer>
                                <Icon size={20} name="caretCircleDown" />
                            </CaretContainer>
                        )}
                    </ExpandedSidebarOnly>
                </InnerContainer>
            </Wrapper>
        </Tooltip>
    );
};
