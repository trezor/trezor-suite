import { SecurityChecklistItem } from 'src/views/onboarding/steps/SecurityCheck/types';

import { Translation } from '../Translation';

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
