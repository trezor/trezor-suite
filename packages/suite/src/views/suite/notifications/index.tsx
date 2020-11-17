import React from 'react';
import styled from 'styled-components';
import { FormattedDate } from 'react-intl';
import { H2, Icon, P, Button } from '@trezor/components';
import { Translation, Image, Card, LayoutContext } from '@suite-components';
import { getNotificationIcon } from '@suite-utils/notification';
import hocNotification, { ViewProps } from '@suite-components/hocNotification';

import { Props } from './Container';
import { MAX_WIDTH } from '@suite-constants/layout';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 16px 32px;
    max-width: ${MAX_WIDTH};
`;

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
`;

const DateP = styled(P)`
    display: flex;
    flex-direction: column;
    font-variant-numeric: tabular-nums;
`;

const EmptyWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 32px 32px 32px;
    height: 100vh;
    justify-content: center;
`;

const Item = styled.div`
    display: flex;
    padding: 16px 0px;

    & + & {
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
    }
`;

const Text = styled.div`
    flex: 1;
    padding: 0px 16px;
`;

const StyledImage = styled(props => <Image {...props} />)`
    width: 340px;
    height: 280px;
    margin-bottom: 40px;
`;

const ActionButton = styled(Button)`
    min-width: 120px;
    align-self: center;
`;

const NotificationView = (props: ViewProps) => {
    const defaultIcon = props.icon ?? getNotificationIcon(props.variant);
    return (
        <Item>
            {defaultIcon && <Icon size={16} icon={defaultIcon} style={{ marginTop: '4px' }} />}
            <Text>
                <P weight={props.notification.seen ? 'normal' : 'bold'}>
                    {typeof props.message === 'string' ? (
                        <Translation id={props.message} />
                    ) : (
                        <Translation {...props.message} />
                    )}
                </P>
                <DateP size="tiny">
                    <FormattedDate
                        value={props.notification.id}
                        year="numeric"
                        month="2-digit"
                        day="2-digit"
                        hour="2-digit"
                        minute="2-digit"
                    />
                </DateP>
            </Text>
            {props.actionLabel && props.action && (
                <ActionButton variant="secondary" onClick={props.action}>
                    <Translation id={props.actionLabel} />
                </ActionButton>
            )}
        </Item>
    );
};

const Notifications = (props: Props) => {
    // TODO: filter notifications only for selected device
    // TODO: decide which notification should be displayed
    // TODO: decide which notification should have CTA
    // const notifications = props.notifications.filter(n =>
    //     deviceUtils.isSelectedInstance(props.device, n.device),
    // );
    const { notifications } = props;

    const { setLayout } = React.useContext(LayoutContext);
    React.useEffect(() => {
        if (setLayout) setLayout('Notifications', undefined);
    }, [setLayout]);

    if (notifications.length < 1) {
        return (
            <>
                <EmptyWrapper>
                    <H2>
                        <Translation id="NOTIFICATIONS_EMPTY_TITLE" />
                    </H2>
                    <P size="small">
                        <Translation id="NOTIFICATIONS_EMPTY_DESC" />
                    </P>
                    <StyledImage image="UNI_EMPTY_PAGE" />
                </EmptyWrapper>
            </>
        );
    }

    return (
        <>
            <Wrapper>
                <StyledCard title={<Translation id="NOTIFICATIONS_TITLE" />}>
                    {notifications.map(n => hocNotification(n, NotificationView))}
                </StyledCard>
            </Wrapper>
        </>
    );
};

export default Notifications;
