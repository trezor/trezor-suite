import { prepareNativeStyle } from '@trezor/styles-native';

import { type SurfaceElevation } from '../types';

type InputStyleProps = {
    isFocused: boolean;
    elevation: SurfaceElevation;
};

export const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography['body-md'],
    flex: 1,
    color: utils.colors.contentNeutral,
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
        borderColor: utils.colors.legacyBackgroundNeutralSubtleOnElevation0,
        backgroundColor: utils.colors.legacyBackgroundNeutralSubtleOnElevation0,
        paddingLeft: 14,
        paddingRight: 14.25,
        extend: [
            {
                condition: isFocused,
                style: {
                    borderColor: utils.colors.elementBorderFieldFocused,
                },
            },
            {
                condition: elevation === '1',
                style: {
                    borderColor: utils.colors.legacyBackgroundNeutralSubtleOnElevation1,
                    backgroundColor: utils.colors.legacyBackgroundNeutralSubtleOnElevation1,
                },
            },
        ],
    }),
);
