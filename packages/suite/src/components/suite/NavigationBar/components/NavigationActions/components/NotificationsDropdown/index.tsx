import { Translation, Notifications } from '@suite-components';
import { Dropdown, DropdownRef, variables } from '@trezor/components';
import React, { useRef, useCallback, useState } from 'react';
import styled from 'styled-components';
import ActionItem from '../ActionItem';
import { useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';

const Wrapper = styled.div<Pick<Props, 'marginLeft' | 'marginRight'>>`
    margin-left: ${props => props.marginLeft};
    margin-right: ${props => props.marginRight};
`;

const NotificationsWrapper = styled.div`
    width: 450px;
    /* overwrite pointer cursor which is defined on Dropdown element by default */
    cursor: default;
    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        width: 330px;
    }
`;

interface Props {
    withAlertDot: boolean;
    marginLeft?: string;
    marginRight?: string;
}

const NotificationsDropdown = ({
    withAlertDot,
    marginLeft = '0px',
    marginRight = '0px',
}: Props) => {
    // use "opened" state to decide if "active" styles on ActionItem should be applied
    const [opened, setOpened] = useState(false);
    const dropdownRef = useRef<DropdownRef>();

    const { resetUnseen } = useActions({
        resetUnseen: notificationActions.resetUnseen,
    });

    const handleToggleChange = useCallback(
        (isToggled: boolean) => {
            if (isToggled) {
                setOpened(true);
            } else {
                // if the dropdown is going to be closed, mark all notifications as seen and "deactivate" ActionItem
                resetUnseen();
                setOpened(false);
            }
        },
        [resetUnseen],
    );

    return (
        <Wrapper marginLeft={marginLeft} marginRight={marginRight}>
            <Dropdown
                onToggle={handleToggleChange}
                ref={dropdownRef}
                alignMenu="right"
                offset={34}
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
                    isActive={opened}
                    withAlertDot={withAlertDot}
                />
            </Dropdown>
        </Wrapper>
    );
};

export default NotificationsDropdown;
