import { useRef, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { breakpointMediaQueries } from '@trezor/styles';
import { boxShadows } from '@trezor/theme';
import { DropdownRef, Dropdown } from '@trezor/components';
import { analytics, EventType } from '@trezor/suite-analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Notifications } from 'src/components/suite/notifications';
import { useDispatch } from 'src/hooks/suite';
import { NavigationItem, NavigationItemProps } from './NavigationItem';

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
        <StyledDropdown
            onToggle={handleToggleChange}
            ref={dropdownRef}
            alignMenu="right-top"
            offsetY={-12}
            content={
                <NotificationsWrapper>
                    <Notifications onCancel={() => dropdownRef.current!.close()} />
                </NotificationsWrapper>
            }
        >
            {isToggled => <StyledNavigationItem {...props} isActive={isToggled} />}
        </StyledDropdown>
    );
};
