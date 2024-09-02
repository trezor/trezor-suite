import { IconName } from '@trezor/components';
import { UIVariant } from '@trezor/components/src/config/types';
import { Color, CSSColor } from '@trezor/theme';
import { DefaultTheme } from 'styled-components';

export const updateVariants = ['tertiary', 'info', 'purple'] as const;
export type UpdateVariant = Extract<UIVariant, (typeof updateVariants)[number]> | 'purple';

export type UpdateStatus = 'up-to-date' | 'update-available' | 'restart-to-update' | 'just-updated';

export const mapUpdateStatusToIcon: Record<UpdateStatus, IconName> = {
    'up-to-date': 'check',
    'update-available': 'arrowDown',
    'restart-to-update': 'arrowsClockwiseFilled',
    'just-updated': 'check',
};

export const mapUpdateStatusToVariant: Record<UpdateStatus, UpdateVariant> = {
    'up-to-date': 'tertiary',
    'update-available': 'info',
    'restart-to-update': 'info',
    'just-updated': 'purple',
};

type MapArgs = {
    $variant: UpdateVariant;
    theme: DefaultTheme;
};

export const mapVariantToIconBackground = ({ $variant, theme }: MapArgs): CSSColor => {
    const colorMap: Record<UpdateVariant, Color> = {
        purple: 'backgroundAlertPurpleSubtleOnElevationNegative',
        tertiary: 'transparent',
        info: 'backgroundAlertBlueSubtleOnElevationNegative',
    };

    return theme[colorMap[$variant]];
};
