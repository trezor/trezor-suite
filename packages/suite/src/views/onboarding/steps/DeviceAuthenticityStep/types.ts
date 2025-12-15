import type { ReactElement, ReactNode } from 'react';

import type { Icon, IconProps } from '@trezor/components';

export type SecurityChecklistItem = {
    icon: ReactElement<IconProps, typeof Icon>;
    content: ReactNode;
    subtitle?: ReactNode;
};
