import { type TransactionEntry } from '@suite-common/toast-notifications';
import { Box, Card, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TransactionNotificationItem } from './TransactionNotificationItem';

type SectionProps = {
    titleId:
        | 'moduleActivityCenter.notifications.sectionNew'
        | 'moduleActivityCenter.notifications.sectionRead';
    notifications: TransactionEntry[];
    seen: boolean;
};

const cardStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp4,
    paddingTop: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp12,
}));

const NotificationSection = ({ titleId, notifications, seen }: SectionProps) => {
    if (notifications.length === 0) {
        return null;
    }

    return (
        <Box>
            <Text variant="body-md">
                <Translation id={titleId} values={{ count: notifications.length }} />
            </Text>
            {notifications.map((notification, index) => (
                <TransactionNotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    seen={seen}
                />
            ))}
        </Box>
    );
};

type Props = {
    unseenNotifications: TransactionEntry[];
    seenNotifications: TransactionEntry[];
};

export const NotificationList = ({ unseenNotifications, seenNotifications }: Props) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card style={applyStyle(cardStyle)}>
            <VStack>
                <NotificationSection
                    titleId="moduleActivityCenter.notifications.sectionNew"
                    notifications={unseenNotifications}
                    seen={false}
                />
                <NotificationSection
                    titleId="moduleActivityCenter.notifications.sectionRead"
                    notifications={seenNotifications}
                    seen
                />
            </VStack>
        </Card>
    );
};
