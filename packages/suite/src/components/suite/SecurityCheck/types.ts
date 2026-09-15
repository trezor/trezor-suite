import { type ReactElement, type ReactNode } from 'react';

import { type Icon, type IconProps } from '@trezor/components';

export type SecurityChecklistItem = {
    icon: ReactElement<IconProps, typeof Icon>;
    content: ReactNode;
    subtitle?: ReactNode;
};
