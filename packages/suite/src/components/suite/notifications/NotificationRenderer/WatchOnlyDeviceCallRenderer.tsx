import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { copyToClipboard } from '@trezor/dom-utils';
import { injectDispatch } from '@trezor/redux-utils';

import type { NotificationRendererProps } from './NotificationRendererProps';

export const WatchOnlyDeviceCallRenderer = ({
    render: View,
    notification,
}: NotificationRendererProps<'watch-only-device-call'>) => {
    const { dispatch } = useServices(injectDispatch);

    const copyTransactionData = async () => {
        const result = await copyToClipboard(notification.payload);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return (
        <View
            notification={notification}
            variant="warning"
            message="TOAST_WATCH_ONLY_DEVICE_CALL"
            messageValues={{ method: notification.method }}
            action={{ label: 'TR_COPY_TRANSACTION_DATA', onClick: copyTransactionData }}
        />
    );
};
