import { Icon } from '@trezor/components';

import { SecurityChecklistItem } from 'src/views/onboarding/steps/SecurityCheck/types';

import { Translation } from '../Translation';

export const hardFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: <Icon size={24} variant="default" name="hand" />,
        content: <Translation id="TR_AVOID_USING_DEVICE" />,
    },
    {
        icon: <Icon size={24} variant="default" name="chat" />,
        content: <Translation id="TR_USE_CHAT" values={{ b: chunks => <b>{chunks}</b> }} />,
    },
];

export const softFailureChecklistItems: SecurityChecklistItem[] = [
    {
        icon: <Icon size={24} variant="default" name="browsers" />,
        content: <Translation id="TR_TROUBLESHOOTING_CLOSE_TABS" />,
        subtitle: <Translation id="TR_TROUBLESHOOTING_CLOSE_TABS_DESCRIPTION" />,
    },
    {
        icon: <Icon size={24} variant="default" name="plugs" />,
        content: <Translation id="TR_DISCONNECT_YOUR_TREZOR" />,
        subtitle: <Translation id="TR_DISCONNECT_YOUR_TREZOR_SUBTITLE" />,
    },
    {
        icon: <Icon size={24} variant="default" name="chat" />,
        content: <Translation id="TR_PROBLEM_PERSISTS" />,
        subtitle: <Translation id="TR_PROBLEM_PERSISTS_SUBTITLE" />,
    },
];
