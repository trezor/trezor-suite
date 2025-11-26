import { DefaultTheme } from 'styled-components';

import { CSSColor, TypographyStyle } from '@trezor/theme';

import { BulletListDirection, BulletListItemState, BulletSize } from './types';

type colorMapArgs = {
    $state: BulletListItemState;
    theme: DefaultTheme;
};

type sizeMapArgs = {
    $size: BulletSize;
};

export const mapStateToColor = ({ $state, theme }: colorMapArgs) => {
    const colorMap: Record<BulletListItemState, CSSColor> = {
        active: theme.textDefault,
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

export const mapPropsToTypographyStyle = (
    direction: BulletListDirection,
    state: BulletListItemState,
) => {
    const typographyStyleMap: Record<
        BulletListDirection,
        Record<BulletListItemState, TypographyStyle>
    > = {
        vertical: {
            active: 'highlight',
            default: 'body',
            done: 'body',
            pending: 'body',
        },
        horizontal: {
            active: 'highlight',
            default: 'hint',
            done: 'hint',
            pending: 'hint',
        },
    };

    return typographyStyleMap[direction][state];
};
