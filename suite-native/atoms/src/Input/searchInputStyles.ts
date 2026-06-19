import { prepareNativeStyle } from '@trezor/styles-native';

type InputStyleProps = {
    isFocused: boolean;
};

export const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography['body-md'],
    flex: 1,
    color: utils.colors.contentPrimary,
    marginLeft: utils.spacings.sp16,
}));

export const inputWrapperStyle = prepareNativeStyle<InputStyleProps>((utils, { isFocused }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.r12,
    borderColor: utils.colors.elementBorderField,
    backgroundColor: utils.colors.elementFillField,
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp16,
    extend: {
        condition: isFocused,
        style: {
            borderColor: utils.colors.elementBorderFieldFocused,
        },
    },
}));
