import { type ReactNode } from 'react';

import { type IconComponent } from '@trezor/components';

export type TroubleshootingTipsItem = {
    key: string;
    heading?: ReactNode;
    description?: ReactNode;
    hide?: boolean;
    icon?: IconComponent;
};
