import { DiscreetText, Text, TextProps } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { isAndroid } from '@trezor/env-utils';

type AmountTextProps = {
    isDiscreetText?: boolean;
    value: string | null;
} & TextProps;

const amountTextStyle = prepareNativeStyle(_ => ({
    // Because of this RN issue https://github.com/facebook/react-native/issues/46436
    // turning off custom letter spacing for amounts on Android.
    extend: {
        condition: isAndroid(),
        style: {
            letterSpacing: 0,
        },
    },
}));

export const AmountText = ({ value, isDiscreetText = true, ...textProps }: AmountTextProps) => {
    const { applyStyle } = useNativeStyles();

    const TextComponent = isDiscreetText ? DiscreetText : Text;

    return (
        <TextComponent style={applyStyle(amountTextStyle)} {...textProps}>
            {value}
        </TextComponent>
    );
};
