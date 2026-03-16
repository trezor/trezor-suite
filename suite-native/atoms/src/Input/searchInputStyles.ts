import { prepareNativeStyle } from '@trezor/styles';

import { type SurfaceElevation } from '../types';

type InputStyleProps = {
    isFocused: boolean;
    elevation: SurfaceElevation;
};

export const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography['body-md'],
    flex: 1,
    color: utils.colors.textOnTertiary,
    marginLeft: utils.spacings.sp16,
}));

export const inputWrapperStyle = prepareNativeStyle<InputStyleProps>(
    (utils, { isFocused, elevation }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 48,
        borderWidth: utils.borders.widths.small,
        borderRadius: utils.borders.radii.r8,
        borderColor: utils.colors.backgroundNeutralSubtleOnElevation0,
        backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
        paddingLeft: 14,
        paddingRight: 14.25,
        extend: [
            {
                condition: isFocused,
                style: {
                    borderColor: utils.colors.borderFocus,
                },
            },
            {
                condition: elevation === '1',
                style: {
                    borderColor: utils.colors.backgroundNeutralSubtleOnElevation1,
                    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
                },
            },
        ],
    }),
);
