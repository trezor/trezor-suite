import { useCallback, useRef, useState } from 'react';

import styled, { css } from 'styled-components';

import { notificationsActions } from '@suite-common/toast-notifications';
import { Box, Menu, Popover, useMediaQuery, variables } from '@trezor/components';
import { useOnClickOutside } from '@trezor/react-utils';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

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
    const [isOpen, setIsOpen] = useState(false);
    const isBelowLaptop = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.LG})`);
    const contentRef = useRef<HTMLUListElement>(null);
    const dispatch = useDispatch();

    useOnClickOutside([contentRef], () => {
        if (isOpen) {
            setIsOpen(false);
        }
    });

    const handleToggleChange = useCallback(() => {
        if (isOpen) {
            // if the dropdown is going to be closed, mark all notifications as seen and "deactivate" ActionItem
            dispatch(notificationsActions.resetUnseen());
        }

        analytics.report({
            type: EventType.MenuNotificationsToggle,
            payload: {
                value: isOpen,
            },
        });

        setIsOpen(prev => !prev);
    }, [isOpen, dispatch]);

    return (
        <Popover
            content={
                <Menu
                    ref={contentRef}
                    content={
                        <Box width={isBelowLaptop ? 330 : 450} margin={spacings.xs}>
                            <Notifications onCancel={handleToggleChange} />
                        </Box>
                    }
                    setToggled={handleToggleChange}
                />
            }
            placement={{ position: 'right', alignment: 'start' }}
            isOpen={isOpen}
        >
            <StyledNavigationItem {...props} isActive={isOpen} onClick={handleToggleChange} />
        </Popover>
    );
};
