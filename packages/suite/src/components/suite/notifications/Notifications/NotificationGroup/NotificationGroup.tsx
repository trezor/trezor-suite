import { Translation, type TranslationKey } from '@suite/intl';
import { getSeenAndUnseenNotifications } from '@suite-common/toast-notifications';
import { Column, H2, H4, IconCircle, Paragraph } from '@trezor/components';
import { BellZIcon } from '@trezor/icons';

import { type AppState } from 'src/types/suite';

import { NotificationList } from './NotificationList/NotificationList';

interface NotificationGroupProps {
    notifications: AppState['notifications'];
    emptyTitle?: TranslationKey;
    emptyDescription?: TranslationKey;
}
export const NotificationGroup = ({
    notifications,
    emptyTitle = 'NOTIFICATIONS_EMPTY_TITLE',
    emptyDescription = 'NOTIFICATIONS_EMPTY_DESC',
}: NotificationGroupProps) => {
    const { seenNotifications, unseenNotifications } = getSeenAndUnseenNotifications(notifications);

    const seenCount = seenNotifications.length;
    const unseenCount = unseenNotifications.length;

    if (unseenCount === 0 && seenCount === 0) {
        return (
            <Column alignItems="center" gap={16} padding={{ vertical: 64 }}>
                <IconCircle icon={BellZIcon} size={112} intent="info" />
                <Column alignItems="center" gap={4}>
                    <H2>
                        <Translation id={emptyTitle} />
                    </H2>
                    <Paragraph typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id={emptyDescription} />
                    </Paragraph>
                </Column>
            </Column>
        );
    }

    return (
        <Column gap={24}>
            {unseenCount > 0 && (
                <Column gap={12}>
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
                <Column gap={12}>
                    <H4>
                        <Translation id="NOTIFICATIONS_SEEN_TITLE" />
                    </H4>
                    <NotificationList notifications={seenNotifications} />
                </Column>
            )}
        </Column>
    );
};
