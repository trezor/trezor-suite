import { Paragraph, H4, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AppState } from 'src/types/suite';
import { Translation } from 'src/components/suite';
import { getSeenAndUnseenNotifications } from 'src/utils/suite/notification';

import { NotificationList } from './NotificationList/NotificationList';

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
            <Column alignItems="normal" gap={spacings.xs}>
                <H4>
                    <Translation id="NOTIFICATIONS_EMPTY_TITLE" />
                </H4>
                <Paragraph typographyStyle="hint" variant="tertiary">
                    <Translation id="NOTIFICATIONS_EMPTY_DESC" />
                </Paragraph>
            </Column>
        );
    }

    return (
        <Column alignItems="normal" gap={spacings.xl}>
            {unseenCount > 0 && (
                <Column alignItems="normal" gap={spacings.md}>
                    <H4>
                        <Translation
                            id="NOTIFICATIONS_UNSEEN_TITLE"
                            values={{ count: unseenCount }}
                        />
                    </H4>
                    <NotificationList notifications={unseenNotifications} />
                </Column>
            )}

            {seenCount > 0 && (
                <Column alignItems="normal" gap={spacings.md}>
                    <H4>
                        <Translation id="NOTIFICATIONS_SEEN_TITLE" />
                    </H4>
                    <NotificationList notifications={seenNotifications} />
                </Column>
            )}
        </Column>
    );
};
