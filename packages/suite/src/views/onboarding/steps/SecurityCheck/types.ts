import { ReactElement, ReactNode } from 'react';

import { Icon, IconProps } from '@trezor/components';

export type SecurityChecklistItem = {
    icon: ReactElement<IconProps, typeof Icon>;
    content: ReactNode;
    subtitle?: ReactNode;
};
