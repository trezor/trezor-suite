import { useRef, useCallback, useState } from 'react';
import styled from 'styled-components';

import { analytics, EventType } from '@trezor/suite-analytics';
import { Dropdown, DropdownRef, variables } from '@trezor/components';
import { notificationsActions } from '@suite-common/toast-notifications';

import { Notifications, Translation } from 'src/components/suite';
import { ActionItem } from './ActionItem';
import { useDispatch } from 'src/hooks/suite';

const Wrapper = styled.div`
    margin-left: 0;
    margin-right: 0;
`;

const NotificationsWrapper = styled.div`
    width: 450px;

    /* overwrite pointer cursor which is defined on Dropdown element by default */
    cursor: default;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        width: 330px;
    }
`;

interface NavNotificationsProps {
    indicator?: boolean;
    isActive?: boolean;
}

export const NavNotifications = ({
    indicator = false,
    isActive = false,
}: NavNotificationsProps) => {
    // use "opened" state to decide if "active" styles on ActionItem should be applied
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
        <Wrapper>
            <Dropdown
                onToggle={handleToggleChange}
                ref={dropdownRef}
                alignMenu="right"
                offset={4}
                items={[
                    {
                        key: 'dropdown',

                        options: [
                            {
                                key: 'notifications',
                                label: (
                                    <NotificationsWrapper>
                                        <Notifications
                                            onCancel={() => dropdownRef.current!.close()}
                                        />
                                    </NotificationsWrapper>
                                ),
                                noPadding: true,
                                noHover: true, // no hover effect
                                callback: () => false, // don't close Dropdown on mouse click automatically
                            },
                        ],
                    },
                ]}
            >
                <ActionItem
                    label={<Translation id="TR_NOTIFICATIONS" />}
                    icon="NOTIFICATION"
                    isOpen={open}
                    isActive={isActive}
                    indicator={indicator ? 'alert' : undefined}
                />
            </Dropdown>
        </Wrapper>
    );
};
