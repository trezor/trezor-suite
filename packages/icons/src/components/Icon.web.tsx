import React from 'react';
import { IconName } from '../icons';
import { Color } from '@trezor/theme';

type IconProps = {
    name: IconName;
    size?: IconSize;
    color?: Color;
};

const iconSizes = {
    small: 12,
} as const;

type IconSize = keyof typeof iconSizes;

// This will be used for web in the future
export const Icon: React.FC<IconProps> = () => null;
