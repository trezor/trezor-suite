import { CheckIcon, InfoIcon, WarningIcon } from '@trezor/icons';

import { type ToastNotificationVariant } from 'src/types/suite';

export const getNotificationIcon = (variant: ToastNotificationVariant) => {
    switch (variant) {
        case 'info':
            return InfoIcon;
        case 'warning':
        case 'error':
            return WarningIcon;
        case 'success':
            return CheckIcon;
        // no default
    }
};
