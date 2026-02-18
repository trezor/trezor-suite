import type { ReactNode } from 'react';

import type { BannerIntent, IconName } from '@trezor/components';

export type TroubleshootingTipsItem = {
    key: string;
    heading?: ReactNode;
    description?: ReactNode;
    hide?: boolean;
    icon?: IconName;
};

export type TroubleshootingTipsBaseProps = {
    label?: ReactNode;
    ctaLabel?: ReactNode;
    cta?: ReactNode;
    initiallyIsOpen?: boolean;
    'data-testid'?: string;
    toggleText?: ReactNode;
    intent?: BannerIntent;
    items: TroubleshootingTipsItem[];
};
