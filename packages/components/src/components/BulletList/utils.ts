import { Color, TypographyStyle } from '@trezor/theme';

import { BulletListDirection, BulletListItemState, BulletSize } from './types';

type sizeMapArgs = {
    $size: BulletSize;
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

export const mapStateToTextColor = ($state: BulletListItemState): Color => {
    const colorMap: Record<BulletListItemState, Color> = {
        active: 'textDefault',
        default: 'textDefault',
        done: 'textPrimaryDefault',
        pending: 'textSubdued',
    };

    return colorMap[$state];
};
