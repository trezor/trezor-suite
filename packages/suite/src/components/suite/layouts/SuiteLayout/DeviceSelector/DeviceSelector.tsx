import styled, { css } from 'styled-components';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Icon } from '@trezor/components';
import { focusStyleTransition, getFocusShadowStyle } from '@trezor/components/src/utils/utils';
import { borders, spacingsPx } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { SidebarDeviceStatus } from './SidebarDeviceStatus';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';
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

const InnerContainer = styled.div`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: ${spacingsPx.md};
    min-height: 42px;
    -webkit-app-region: no-drag;
`;

export const DeviceSelector = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const handleSwitchDeviceClick = () => {
        dispatch(
            goto('suite-switch-device', {
                params: {
                    cancelable: true,
                },
            }),
        );
    };

    const { isSidebarCollapsed } = useResponsiveContext();

    return (
        <Wrapper $isSidebarCollapsed={isSidebarCollapsed}>
            <InnerContainer
                onClick={handleSwitchDeviceClick}
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
        </Wrapper>
    );
};
