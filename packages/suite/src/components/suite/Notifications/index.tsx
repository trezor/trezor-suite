import { useSelector } from '@suite-hooks';
import { NotificationEntry } from '@suite-reducers/notificationReducer';
import { Icon, useTheme, variables } from '@trezor/components';
import React, { useState } from 'react';
import styled from 'styled-components';
import NotificationGroup from './components/NotificationGroup';

const Wrapper = styled.div`
    width: 100%;
`;

const Header = styled.div`
    display: flex;
    padding: 0 22px;
    align-items: center;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY_ALT};
`;
const TabSelector = styled.div`
    display: flex;
    flex-grow: 1;
`;

const TabButton = styled.button<{ selected: boolean }>`
    border: none;
    background-color: inherit;
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-top: 16px;
    padding-bottom: 12px;
    margin-right: 24px;
    cursor: pointer;
    /* change styles if the button is selected*/
    color: ${props =>
        props.selected ? `${props.theme.TYPE_DARK_GREY}` : `${props.theme.TYPE_LIGHT_GREY}`};
    border-bottom: 2px solid;
    border-color: ${props =>
        props.selected ? props.theme.TYPE_DARK_GREY : props.theme.BG_WHITE_ALT};
`;

const CloseButtonWrapper = styled.div``;

const Content = styled.div`
    padding: 4px 22px 12px 22px;
    max-height: 340px;
    overflow-y: auto;
    overflow-x: hidden;
`;
interface Props {
    onCancel?: () => any;
}

const Notifications = (props: Props) => {
    const notifications = useSelector(state => state.notifications);
    const [selectedTab, setSelectedTab] = useState<'important' | 'all'>('important');
    const theme = useTheme();

    // list of notification types that are important to the user
    const importantTypes: Array<NotificationEntry['type']> = [
        'tx-sent',
        'tx-received',
        'tx-confirmed',
        'clear-storage',
        'pin-changed',
        'device-wiped',
        'backup-success',
        'backup-failed',
    ];

    // get important notifications
    const importantNotifications = notifications.filter(notification =>
        importantTypes.includes(notification.type),
    );

    const onCancel = () => {
        if (props.onCancel) props.onCancel();
    };

    return (
        <Wrapper>
            <Header>
                <TabSelector>
                    <TabButton
                        selected={selectedTab === 'important'}
                        onClick={() => setSelectedTab('important')}
                    >
                        Notifications
                    </TabButton>
                    <TabButton
                        selected={selectedTab === 'all'}
                        onClick={() => setSelectedTab('all')}
                    >
                        All activity
                    </TabButton>
                </TabSelector>
                {props.onCancel && (
                    <CloseButtonWrapper>
                        <Icon
                            icon="CROSS"
                            size={20}
                            color={theme.TYPE_LIGHT_GREY}
                            useCursorPointer
                            onClick={onCancel}
                        />
                    </CloseButtonWrapper>
                )}
            </Header>
            <Content>
                <NotificationGroup
                    notifications={
                        selectedTab === 'important' ? importantNotifications : notifications
                    }
                />
            </Content>
        </Wrapper>
    );
};

export default Notifications;
