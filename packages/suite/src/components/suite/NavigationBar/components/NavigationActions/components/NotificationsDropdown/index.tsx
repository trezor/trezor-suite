import { Translation } from '@suite-components';
import { Dropdown, DropdownRef, variables } from '@trezor/components';
import React, { useRef } from 'react';
import styled from 'styled-components';
import Notifications from '../../../../../Notifications';
import ActionItem from '../ActionItem';
import { useDispatch } from 'react-redux';
import * as notificationActions from '@suite-actions/notificationActions';
import { Dispatch } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    z-index: 10;
    /* same as left padding for ActionItem */
    margin-right: 28px;
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
    isActive: boolean;
    withAlertDot: boolean;
}

const NotificationsDropdown = ({ isActive, withAlertDot }: Props) => {
    const dropdownRef = useRef<DropdownRef>();
    const dispatch = useDispatch<Dispatch>();

    const handleToggleChange = (toggled?: boolean) => {
        // if the dropdown is going to be closed, set all notifications as seen
        if (!toggled) {
            dispatch(notificationActions.resetUnseen());
        }
    };

    return (
        <Wrapper>
            <Dropdown
                onToggleChange={handleToggleChange}
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
                <div>
                    {/* Wrap <ActionItem/> in <div> so that user can close the dropdown by clicking somewhere else (TODO: why does it work like that?) */}
                    <ActionItem
                        label={<Translation id="TR_NOTIFICATIONS" />}
                        icon="NOTIFICATION"
                        isActive={isActive}
                        withAlertDot={withAlertDot}
                    />
                </div>
            </Dropdown>
        </Wrapper>
    );
};

export default NotificationsDropdown;
