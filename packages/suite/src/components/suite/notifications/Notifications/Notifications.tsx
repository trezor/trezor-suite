import { useSelector } from 'src/hooks/suite';
import { Icon, variables } from '@trezor/components';
import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import { SETTINGS } from 'src/config/suite';
import { NotificationGroup } from './NotificationGroup/NotificationGroup';

const Wrapper = styled.div`
    width: 100%;
`;

const Header = styled.div`
    display: flex;
    margin-top: -8px;
    padding: 0 22px;
    align-items: center;
    border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY_ALT};
`;
const TabSelector = styled.div`
    display: flex;
    flex-grow: 1;
`;

const TabButton = styled.button<{ $selected: boolean }>`
    border: none;
    background-color: inherit;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-top: 16px;
    padding-bottom: 12px;
    margin-right: 24px;
    cursor: pointer;

    /* change styles if the button is selected */
    color: ${({ $selected, theme }) =>
        $selected ? theme.legacy.TYPE_DARK_GREY : theme.legacy.TYPE_LIGHT_GREY};
    border-bottom: 2px solid;
    border-color: ${({ $selected, theme }) =>
        $selected ? theme.legacy.TYPE_DARK_GREY : 'transparent'};
    transition: border-color 0.1s;

    &:hover {
        border-color: ${({ theme, $selected }) => !$selected && theme.legacy.STROKE_GREY};
    }
`;

const CloseButtonWrapper = styled.div``;

const Content = styled.div`
    padding: 12px 22px;
    max-height: 340px;
    overflow: hidden auto;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        max-height: 100%;
    }
`;
interface NotificationsProps {
    onCancel?: () => void;
}

export const Notifications = (props: NotificationsProps) => {
    const notifications = useSelector(state => state.notifications);
    const [selectedTab, setSelectedTab] = useState<'important' | 'all'>('important');
    const theme = useTheme();

    // get important notifications
    const importantNotifications = notifications.filter(notification =>
        SETTINGS.IMPORTANT_NOTIFICATION_TYPES.includes(notification.type),
    );

    const onCancel = () => {
        if (props.onCancel) {
            props.onCancel();
        }
    };

    return (
        <Wrapper>
            <Header>
                <TabSelector>
                    <TabButton
                        $selected={selectedTab === 'important'}
                        onClick={() => setSelectedTab('important')}
                    >
                        <Translation id="NOTIFICATIONS_IMPORTANT_TITLE" />
                    </TabButton>
                    <TabButton
                        $selected={selectedTab === 'all'}
                        onClick={() => setSelectedTab('all')}
                    >
                        <Translation id="NOTIFICATIONS_ALL_TITLE" />
                    </TabButton>
                </TabSelector>
                {props.onCancel && (
                    <CloseButtonWrapper>
                        <Icon
                            name="close"
                            size={20}
                            color={theme.legacy.TYPE_LIGHT_GREY}
                            hoverColor={theme.legacy.TYPE_LIGHTER_GREY}
                            cursorPointer
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
