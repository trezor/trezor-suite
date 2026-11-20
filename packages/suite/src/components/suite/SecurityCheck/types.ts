import { type ReactElement, type ReactNode } from 'react';

import { type Icon, type IconComponent, type IconProps } from '@trezor/components';

export type SecurityChecklistItem = {
    icon: ReactElement<IconProps, typeof Icon>;
    content: ReactNode;
    subtitle?: ReactNode;
};

export type SecurityConfirmationItem = {
    id: string;
    icon: IconComponent;
    content: ReactNode;
};
