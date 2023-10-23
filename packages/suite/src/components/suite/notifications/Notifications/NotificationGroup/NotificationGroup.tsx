import styled from 'styled-components';

import { variables, P } from '@trezor/components';
import { AppState } from 'src/types/suite';
import { Translation } from 'src/components/suite';
import { getSeenAndUnseenNotifications } from 'src/utils/suite/notification';
import { NotificationList } from './NotificationList/NotificationList';

const SectionHeadline = styled.div`
    margin-top: 14px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    height: 16px;
    line-height: 1.33;
    letter-spacing: 0.2px;
    opacity: 0.6;
`;

const EmptyWrapper = styled.div`
    white-space: break-spaces;
`;

const EmptyHeadline = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 10px 0 6px;
`;

const EmptyDescriptionP = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;
interface NotificationGroupProps {
    notifications: AppState['notifications'];
}
export const NotificationGroup = (props: NotificationGroupProps) => {
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
                <EmptyDescriptionP type="hint">
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
