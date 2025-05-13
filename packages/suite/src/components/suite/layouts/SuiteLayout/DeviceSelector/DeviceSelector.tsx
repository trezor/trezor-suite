import styled, { css } from 'styled-components';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Icon, Tooltip } from '@trezor/components';
import { focusStyleTransition, getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { borders, spacingsPx } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { ViewOnlyTooltip } from 'src/views/view-only/ViewOnlyTooltip';

import { SidebarDeviceStatus } from './SidebarDeviceStatus';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';
import { Translation } from '../../../Translation';
import { ExpandedSidebarOnly } from '../Sidebar/ExpandedSidebarOnly';

const CaretContainer = styled.div`
    background: transparent;
    padding: 10px;
    border-radius: 50%;
    transition: background 0.15s;
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
            background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation0};
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

export const DeviceSelector = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();
    const { isDiscoveryRunning } = useDiscovery();

    const handleSwitchDeviceClick = () => {
        if (!isDiscoveryRunning) {
            dispatch(
                goto('suite-switch-device', {
                    params: {
                        cancelable: true,
                    },
                }),
            );
        }
    };

    const { isSidebarCollapsed } = useResponsiveContext();

    return (
        <Wrapper $isSidebarCollapsed={isSidebarCollapsed}>
            <ViewOnlyTooltip>
                <Tooltip
                    isActive={isDiscoveryRunning}
                    isFullWidth
                    placement="bottom"
                    cursor={isDiscoveryRunning ? 'not-allowed' : undefined}
                    content={<Translation id="TR_UNAVAILABLE_WHILE_LOADING" />}
                >
                    <InnerContainer
                        onClick={handleSwitchDeviceClick}
                        $isDisabled={isDiscoveryRunning}
                        tabIndex={0}
                        data-testid="@menu/switch-device"
                    >
                        <SidebarDeviceStatus />

                        <ExpandedSidebarOnly>
                            {selectedDevice && selectedDevice.state && (
                                <CaretContainer>
                                    <Icon size={20} name="caretCircleDown" />
                                </CaretContainer>
                            )}
                        </ExpandedSidebarOnly>
                    </InnerContainer>
                </Tooltip>
            </ViewOnlyTooltip>
        </Wrapper>
    );
};
