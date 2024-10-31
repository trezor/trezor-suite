import { Translation } from '../Translation';
import { SecurityChecklistItem } from 'src/views/onboarding/steps/SecurityCheck/types';

export const hardFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: 'plugs',
        content: <Translation id="TR_DISCONNECT_DEVICE" />,
    },
    {
        icon: 'hand',
        content: <Translation id="TR_AVOID_USING_DEVICE" />,
    },
    {
        icon: 'chat',
        content: <Translation id="TR_USE_CHAT" values={{ b: chunks => <b>{chunks}</b> }} />,
    },
];

export const softFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: 'plugs',
        content: <Translation id="TR_RECONNECT_YOUR_DEVICE" />,
    },
    {
        icon: 'eye',
        content: <Translation id="TR_SEE_IF_ISSUE_PERSISTS" />,
    },
    {
        icon: 'chat',
        content: <Translation id="TR_USE_CHAT" values={{ b: chunks => <b>{chunks}</b> }} />,
    },
];
