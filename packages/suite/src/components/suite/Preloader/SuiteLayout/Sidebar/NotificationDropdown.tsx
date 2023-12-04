import { useState, useRef, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { breakpointMediaQueries } from '@trezor/styles';
import { DropdownRef, Dropdown } from '@trezor/components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Notifications } from 'src/components/suite/notifications';
import { useDispatch } from 'src/hooks/suite';
import { NavigationItem, NavigationItemProps } from './NavigationItem';
import { boxShadows } from '@trezor/theme';

const NotificationsWrapper = styled.div`
    width: 450px;
    cursor: default;

    ${breakpointMediaQueries.below_lg} {
        width: 330px;
    }
`;

const StyledNavigationItem = styled(NavigationItem)`
    ${({ theme, isActive }) =>
        isActive &&
        css`
            background: ${theme.backgroundTertiaryPressedOnElevation0};
            box-shadow: ${boxShadows.elevation1};
        `}
`;

const StyledDropdown = styled(Dropdown)`
    width: 100%;
`;

export const NotificationDropdown = (props: NavigationItemProps) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<DropdownRef>();

    const dispatch = useDispatch();

    const handleToggleChange = useCallback(
        (isToggled: boolean) => {
            if (isToggled) {
                setOpen(true);
            } else {
                // if the dropdown is going to be closed, mark all notifications as seen and "deactivate" ActionItem
                dispatch(notificationsActions.resetUnseen());
                setOpen(false);
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
        <StyledDropdown
            onToggle={handleToggleChange}
            ref={dropdownRef}
            alignMenu="left"
            content={
                <NotificationsWrapper>
                    <Notifications onCancel={() => dropdownRef.current!.close()} />
                </NotificationsWrapper>
            }
        >
            <StyledNavigationItem {...props} isActive={open} />
        </StyledDropdown>
    );
};
