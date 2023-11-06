import { FC } from 'react';

import { Color } from '@trezor/theme';

import { IconName } from '../icons';

type IconProps = {
    name: IconName;
    size?: IconSize;
    color?: Color;
};

const iconSizes = {
    s: 12,
} as const;

type IconSize = keyof typeof iconSizes;

// This will be used for web in the future
export const Icon: FC<IconProps> = () => null;
