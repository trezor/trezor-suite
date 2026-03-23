import { Translation } from '@suite/intl';
import { Icon } from '@trezor/components';

import { type SecurityChecklistItem } from 'src/views/onboarding/steps/DeviceAuthenticityStep/types';

export const hardFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: <Icon size={24} intent="neutral" name="hand" />,
        content: <Translation id="TR_AVOID_USING_DEVICE" />,
    },
    {
        icon: <Icon size={24} intent="neutral" name="chat" />,
        content: <Translation id="TR_USE_CHAT" values={{ b: chunks => <b>{chunks}</b> }} />,
    },
];

export const softFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: <Icon size={24} intent="neutral" name="browsers" />,
        content: <Translation id="TR_TROUBLESHOOTING_CLOSE_TABS" />,
    },
    {
        icon: <Icon size={24} intent="neutral" name="plugs" />,
        content: <Translation id="TR_DISCONNECT_YOUR_TREZOR" />,
    },
];
