import { Translation } from '@suite/intl';
import { Icon } from '@trezor/components';
import { BrowsersIcon, ChatIcon, HandIcon, PlugsIcon } from '@trezor/icons';

import { type SecurityChecklistItem } from 'src/views/onboarding/steps/DeviceAuthenticityStep/types';

export const hardFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: <Icon size={24} intent="neutral" as={HandIcon} />,
        content: <Translation id="TR_AVOID_USING_DEVICE" />,
    },
    {
        icon: <Icon size={24} intent="neutral" as={ChatIcon} />,
        content: <Translation id="TR_USE_CHAT" values={{ b: chunks => <b>{chunks}</b> }} />,
    },
];

export const softFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: <Icon size={24} intent="neutral" as={BrowsersIcon} />,
        content: <Translation id="TR_TROUBLESHOOTING_CLOSE_TABS" />,
    },
    {
        icon: <Icon size={24} intent="neutral" as={PlugsIcon} />,
        content: <Translation id="TR_DISCONNECT_YOUR_TREZOR" />,
    },
];
