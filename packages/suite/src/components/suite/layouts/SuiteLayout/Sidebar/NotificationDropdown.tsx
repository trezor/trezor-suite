import { useRef, useCallback } from 'react';

import styled, { css } from 'styled-components';

import { DropdownRef, Dropdown, Box, useMediaQuery, variables } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { analytics, EventType } from '@trezor/suite-analytics';
import { notificationsActions } from '@suite-common/toast-notifications';

import { Notifications } from 'src/components/suite/notifications';
import { useDispatch } from 'src/hooks/suite';

import { NavigationItem, NavigationItemProps } from './NavigationItem';

const StyledNavigationItem = styled(NavigationItem)`
    ${({ theme, isActive }) =>
        isActive &&
        css`
            background: ${theme.backgroundTertiaryPressedOnElevation0};
            box-shadow: ${theme.boxShadowBase};
        `}
`;

export const NotificationDropdown = (props: NavigationItemProps) => {
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);
    const dropdownRef = useRef<DropdownRef>();
    const dispatch = useDispatch();

    const handleToggleChange = useCallback(
        (isToggled: boolean) => {
            if (!isToggled) {
                // if the dropdown is going to be closed, mark all notifications as seen and "deactivate" ActionItem
                dispatch(notificationsActions.resetUnseen());
            }

            analytics.report({
                type: EventType.MenuNotificationsToggle,
                payload: {
                    value: isToggled,
                },
            });
        },
        [dispatch],
    );

    return (
        <Dropdown
            onToggle={handleToggleChange}
            ref={dropdownRef}
            alignMenu="right-top"
            offsetY={-12}
            content={
                <Box width={isBelowLaptop ? 330 : 450} margin={spacings.xs}>
                    <Notifications onCancel={() => dropdownRef.current!.close()} />
                </Box>
            }
        >
            {isToggled => <StyledNavigationItem {...props} isActive={isToggled} />}
        </Dropdown>
    );
};
