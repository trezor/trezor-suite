import { Translation, Notifications } from '@suite-components';
import { Dropdown, DropdownRef, variables } from '@trezor/components';
import React, { useRef, useCallback, useState } from 'react';
import styled from 'styled-components';
import ActionItem from './ActionItem';
import { useActions, useAnalytics } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';

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
    const analytics = useAnalytics();

    // use "opened" state to decide if "active" styles on ActionItem should be applied
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<DropdownRef>();

    const { resetUnseen } = useActions({
        resetUnseen: notificationActions.resetUnseen,
    });

    const handleToggleChange = useCallback(
        (isToggled: boolean) => {
            if (isToggled) {
                setOpen(true);
            } else {
                // if the dropdown is going to be closed, mark all notifications as seen and "deactivate" ActionItem
                resetUnseen();
                setOpen(false);
            }

            analytics.report({
                type: 'menu/notifications/toggle',
                payload: {
                    value: isToggled,
                },
            });
        },
        [resetUnseen, analytics],
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
