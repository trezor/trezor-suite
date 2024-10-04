import { IconName } from '@trezor/components';
import { UIVariant } from '@trezor/components/src/config/types';
import { Color, CSSColor } from '@trezor/theme';
import { DefaultTheme } from 'styled-components';
import { goto } from '../../../../../../../actions/suite/routerActions';
import {
    installUpdate,
    openJustUpdatedChangelog,
    setUpdateModalVisibility,
} from '../../../../../../../actions/suite/desktopUpdateActions';
import { Dispatch } from '../../../../../../../types/suite';

export const updateVariants = ['tertiary', 'info', 'purple'] as const;
export type UpdateVariant = Extract<UIVariant, (typeof updateVariants)[number]> | 'purple';

export type UpdateStatusDevice = 'up-to-date' | 'update-available';

export type UpdateStatusSuite =
    | 'up-to-date'
    | 'update-available'
    | 'update-downloaded-manual'
    | 'update-downloaded-auto-restart-to-update'
    | 'just-updated';

export type UpdateStatus = UpdateStatusDevice | UpdateStatusSuite;

export const mapUpdateStatusToIcon: Record<UpdateStatus, IconName> = {
    'update-downloaded-manual': 'arrowDown',
    'update-downloaded-auto-restart-to-update': 'arrowsClockwiseFilled',
    'up-to-date': 'check',
    'update-available': 'arrowDown',
    'just-updated': 'check',
};

export const mapUpdateStatusToVariant: Record<UpdateStatus, UpdateVariant> = {
    'update-downloaded-manual': 'info',
    'update-downloaded-auto-restart-to-update': 'info',
    'up-to-date': 'tertiary',
    'update-available': 'info',
    'just-updated': 'purple',
};

type OnClickCallbackCallback = ((params: { dispatch: Dispatch }) => void) | null;

export const mapDeviceUpdateToClick: Record<UpdateStatusDevice, OnClickCallbackCallback> = {
    'up-to-date': null,
    'update-available': ({ dispatch }) => dispatch(goto('firmware-index')),
};

export const mapSuiteUpdateToClick: Record<UpdateStatusSuite, OnClickCallbackCallback> = {
    'up-to-date': null,
    'update-downloaded-auto-restart-to-update': ({ dispatch }) =>
        dispatch(installUpdate({ shouldInstallOnQuit: false })),
    'update-downloaded-manual': ({ dispatch }) => dispatch(setUpdateModalVisibility('maximized')),
    'just-updated': ({ dispatch }) => dispatch(openJustUpdatedChangelog()),
    'update-available': ({ dispatch }) => dispatch(setUpdateModalVisibility('maximized')),
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
