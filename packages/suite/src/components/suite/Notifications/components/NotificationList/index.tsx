import { Translation, FormattedDateWithBullet } from '@suite-components';
import hocNotification from '@suite-components/hocNotification';
import { ViewProps } from '@suite-components/hocNotification/definitions';
import { AppState } from '@suite-types';
import { getNotificationIcon } from '@suite-utils/notification';
import { Button, Icon, P } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';
import { useLayoutSize } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    max-width: 100%;
`;

const DateP = styled(P)`
    display: flex;
    flex-direction: column;
    font-variant-numeric: tabular-nums;
`;

const Item = styled.div`
    display: flex;
    align-items: center;
    padding: 16px 0px;

    & + & {
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
    }
`;

const Text = styled.div`
    flex: 1;
    padding: 0px 16px;
    white-space: break-spaces;
`;

const ActionButton = styled(Button)`
    min-width: 80px;
    align-self: center;
`;

const NotificationView = (props: ViewProps) => {
    const { isMobileLayout } = useLayoutSize();
    const defaultIcon = props.icon ?? getNotificationIcon(props.variant);
    const { seen } = props.notification;

    return (
        <Item>
            {defaultIcon && (
                <Icon
                    size={20}
                    icon={defaultIcon}
                    style={{ marginBottom: '4px', opacity: seen ? 0.7 : 1 }}
                />
            )}
            <Text>
                <P
                    size="small"
                    weight={seen ? 'normal' : 'bold'}
                    style={{ opacity: seen ? 0.7 : 1 }}
                >
                    {typeof props.message === 'string' ? (
                        <Translation id={props.message} />
                    ) : (
                        <Translation {...props.message} />
                    )}
                </P>
                <DateP size="tiny" style={{ opacity: seen ? 0.7 : 1 }}>
                    <FormattedDateWithBullet value={props.notification.id} />
                </DateP>
            </Text>

            {props.actionLabel &&
                props.action &&
                (isMobileLayout ? (
                    <Icon icon="ARROW_RIGHT" onClick={props.action} size={18} />
                ) : (
                    <ActionButton variant="tertiary" onClick={props.action}>
                        <Translation id={props.actionLabel} />
                    </ActionButton>
                ))}
        </Item>
    );
};

interface Props {
    notifications: AppState['notifications'];
}

const NotificationList = (props: Props) => {
    const { notifications } = props;

    return <Wrapper>{notifications.map(n => hocNotification(n, NotificationView))}</Wrapper>;
};

export default NotificationList;
