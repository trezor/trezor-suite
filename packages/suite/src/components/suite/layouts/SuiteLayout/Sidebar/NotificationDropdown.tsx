import { useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Box, Menu, Popover, PopoverRef } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { Notifications } from 'src/components/suite/notifications';
import { useDispatch, useLayoutSize } from 'src/hooks/suite';

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
    const [isOpen, setIsOpen] = useState(false);
    const { isBelowLaptop } = useLayoutSize();
    const popoverRef = useRef<PopoverRef>(null);
    const dispatch = useDispatch();

    const handleToggleChange = (isOpen: boolean) => {
        if (!isOpen) {
            // if the dropdown is going to be closed, mark all notifications as seen and "deactivate" ActionItem
            dispatch(notificationsActions.resetUnseen());
        }

        analytics.report({
            type: EventType.MenuNotificationsToggle,
            payload: {
                value: !isOpen,
            },
        });

        setIsOpen(isOpen);
    };

    return (
        <Popover
            content={
                <Menu
                    content={
                        <Box width={isBelowLaptop ? 330 : 450} margin={0}>
                            <Notifications onCancel={() => popoverRef.current?.close()} />
                        </Box>
                    }
                />
            }
            ref={popoverRef}
            placement={{ position: 'right', alignment: 'start' }}
            isOpen={isOpen}
            onOpenChange={handleToggleChange}
        >
            <StyledNavigationItem
                {...props}
                isActive={isOpen}
                onClick={() => popoverRef.current?.[isOpen ? 'close' : 'open']()}
            />
        </Popover>
    );
};
