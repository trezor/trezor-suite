import { type DefaultTheme } from 'styled-components';

import { type CSSColor, type Color, type TypographyStyle } from '@trezor/theme';

import { type BulletSize, type StepListDirection, type StepListItemState } from './types';
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

export const mapSizeToCounterTypographyStyle = ({ $size }: sizeMapArgs): TypographyStyle => {
    const typographyStyleMap: Record<BulletSize, TypographyStyle> = {
        small: 'body-xs',
        medium: 'body-sm',
        large: 'body-sm',
    };

    return typographyStyleMap[$size];
};

export const mapPropsToTypographyStyle = (
    direction: StepListDirection,
    state: StepListItemState,
) => {
    const typographyStyleMap: Record<
        StepListDirection,
        Record<StepListItemState, TypographyStyle>
    > = {
        vertical: {
            active: 'body-md-strong',
            default: 'body-md',
            done: 'body-md',
            pending: 'body-md',
        },
        horizontal: {
            active: 'body-sm-strong',
            default: 'body-sm',
            done: 'body-sm',
            pending: 'body-sm',
        },
    };

    return typographyStyleMap[direction][state];
};

export const mapStateToTitleColor = ($state: StepListItemState): Color => {
    const colorMap: Record<StepListItemState, Color> = {
        active: 'contentPrimary',
        default: 'contentPrimary',
        done: 'contentBrand',
        pending: 'contentSecondary',
    };

    return colorMap[$state];
};

export const mapStateToCounterColor = ({
    $state,
    theme,
}: {
    $state: StepListItemState;
    theme: DefaultTheme;
}): CSSColor => {
    const colorMap: Record<StepListItemState, CSSColor> = {
        active: theme.contentPrimary,
        default: theme.contentPrimary,
        done: theme.contentBrand,
        pending: theme.contentDisabled,
    };

    return colorMap[$state];
};

export const mapStateToBackgroundColor = ({
    $state,
    theme,
}: {
    $state: StepListItemState;
    theme: DefaultTheme;
}): CSSColor => {
    const backgroundColorMap: Record<StepListItemState, CSSColor> = {
        active: theme.elementFillElevated,
        default: theme.elementFillElevated,
        done: theme.elementFillBrandSoft,
        pending: 'transparent',
    };

    return backgroundColorMap[$state];
};

export const mapStateToBorderColor = ({
    $state,
    theme,
}: {
    $state: StepListItemState;
    theme: DefaultTheme;
}): CSSColor => {
    const borderColorMap: Record<StepListItemState, CSSColor> = {
        active: 'transparent',
        default: 'transparent',
        done: 'transparent',
        pending: theme.borderNeutral,
    };

    return borderColorMap[$state];
};

export const mapStateToBoxShadow = ({
    $state,
    theme,
}: {
    $state: StepListItemState;
    theme: DefaultTheme;
}): string => {
    const boxShadowMap: Record<StepListItemState, string> = {
        active: theme.elementShadowElevated,
        default: theme.elementShadowElevated,
        done: 'none',
        pending: 'none',
    };

    return boxShadowMap[$state];
};

export const mapStateToBulletColor = ({
    $state,
    theme,
}: {
    $state: StepListItemState;
    theme: DefaultTheme;
}): CSSColor => {
    const bulletColorMap: Record<StepListItemState, CSSColor> = {
        active: theme.contentPrimary,
        default: theme.contentPrimary,
        done: theme.contentBrand,
        pending: theme.contentDisabled,
    };

    return bulletColorMap[$state];
};
