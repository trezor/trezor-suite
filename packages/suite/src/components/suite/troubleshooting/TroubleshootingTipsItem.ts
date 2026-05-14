import { type ReactNode } from 'react';

import { type IconName } from '@trezor/components';

export type TroubleshootingTipsItem = {
    key: string;
    heading?: ReactNode;
    description?: ReactNode;
    hide?: boolean;
    icon?: IconName;
};
