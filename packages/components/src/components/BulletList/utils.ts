import { type Color, type TypographyStyle } from '@trezor/theme';

import { type BulletListDirection, type BulletListItemState, type BulletSize } from './types';
import { type IconCircleSize } from '../IconCircle/types';

type sizeMapArgs = {
    $size: BulletSize;
};

export const mapSizeToDimension = ({ $size }: sizeMapArgs): IconCircleSize => {
    const sizeMap: Record<BulletSize, IconCircleSize> = {
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
            active: 'body-md-strong',
            default: 'body-md',
            done: 'body-md',
            pending: 'body-md',
        },
        horizontal: {
            active: 'body-md-strong',
            default: 'body-sm',
            done: 'body-sm',
            pending: 'body-sm',
        },
    };

    return typographyStyleMap[direction][state];
};

export const mapStateToTextColor = ($state: BulletListItemState): Color => {
    const colorMap: Record<BulletListItemState, Color> = {
        active: 'contentPrimary',
        default: 'contentPrimary',
        done: 'contentBrand',
        pending: 'contentSecondary',
    };

    return colorMap[$state];
};
