import { AppState } from '@suite-types';
import { variables, P } from '@trezor/components';
import { Translation } from '@suite-components';
import { getSeenAndUnseenNotifications } from '@suite-utils/notification';
import React from 'react';
import styled from 'styled-components';
import NotificationList from '../NotificationList';

const SectionHeadline = styled.div`
    margin-top: 14px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    height: 16px;
    line-height: 1.33;
    letter-spacing: 0.2px;
    opacity: 0.6;
`;

const EmptyWrapper = styled.div`
    white-space: break-spaces;
`;

const EmptyHeadline = styled.div`
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 10px 0 6px 0;
    opacity: 0.9;
`;

const EmptyDescriptionP = styled(P)`
    opacity: 0.7;
`;
interface Props {
    notifications: AppState['notifications'];
}
const NotificationGroup = (props: Props) => {
    const { seenNotifications, unseenNotifications } = getSeenAndUnseenNotifications(
        props.notifications,
    );

    const seenCount = seenNotifications.length;
    const unseenCount = unseenNotifications.length;

    if (unseenCount === 0 && seenCount === 0) {
        return (
            <EmptyWrapper>
                <EmptyHeadline>
                    <Translation id="NOTIFICATIONS_EMPTY_TITLE" />
                </EmptyHeadline>
                <EmptyDescriptionP size="small">
                    <Translation id="NOTIFICATIONS_EMPTY_DESC" />
                </EmptyDescriptionP>
            </EmptyWrapper>
        );
    }

    return (
        <>
            {unseenCount > 0 && (
                <>
                    <SectionHeadline>
                        <Translation
                            id="NOTIFICATIONS_UNSEEN_TITLE"
                            values={{ count: unseenCount }}
                        />
                    </SectionHeadline>
                    <NotificationList notifications={unseenNotifications} />
                </>
            )}

            {seenCount > 0 && (
                <>
                    <SectionHeadline>
                        <Translation id="NOTIFICATIONS_SEEN_TITLE" />
                    </SectionHeadline>
                    <NotificationList notifications={seenNotifications} />
                </>
            )}
        </>
    );
};

export default NotificationGroup;
