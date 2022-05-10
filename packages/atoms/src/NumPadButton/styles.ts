import { Color } from '@trezor/theme';
import { NativeStyleObject, prepareNativeStyle } from '@trezor/styles';

import { NumPadButtonStyleProps, NumPadButtonVariant } from './types';

export const numPadButtonStyle = prepareNativeStyle<NumPadButtonStyleProps>(
    (utils, { variant }) => {
        const numPadButtonColorSchemeStyles: Record<NumPadButtonVariant, NativeStyleObject> = {
            primary: {
                backgroundColor: utils.colors.green,
            },
            secondary: {
                backgroundColor: utils.colors.gray300,
            },
            default: {
                backgroundColor: 'transparent',
            },
        };

        return {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            width: 48,
            height: 48,
            borderRadius: utils.borders.radii.round,
            ...numPadButtonColorSchemeStyles[variant],
        };
    },
);

export const buttonColorSchemeFontColor: Record<NumPadButtonVariant, Color> = {
    primary: 'white',
    secondary: 'gray700',
    default: 'gray700',
};
