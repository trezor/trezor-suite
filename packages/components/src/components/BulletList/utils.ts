import { DefaultTheme } from 'styled-components';

import { CSSColor } from '@trezor/theme';

import { BulletListItemState, BulletSize } from './types';

type colorMapArgs = {
    $state: BulletListItemState;
    theme: DefaultTheme;
};

type sizeMapArgs = {
    $size: BulletSize;
};

export const mapStateToColor = ({ $state, theme }: colorMapArgs) => {
    const colorMap: Record<BulletListItemState, CSSColor> = {
        default: theme.textDefault,
        done: theme.textPrimaryDefault,
        pending: theme.textSubdued,
    };

    return colorMap[$state];
};

export const mapSizeToDimension = ({ $size }: sizeMapArgs) => {
    const sizeMap: Record<BulletSize, number> = {
        small: 16,
        medium: 24,
        large: 32,
    };

    return sizeMap[$size];
};
