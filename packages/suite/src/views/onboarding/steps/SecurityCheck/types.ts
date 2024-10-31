import { ReactNode } from 'react';
import { IconName } from '@trezor/components';

export type SecurityChecklistItem = {
    icon: IconName;
    content: ReactNode;
};
