import {
    DiscreetText,
    Text,
    TextProps,
    resetLetterSpacingOnAndroidStyle,
} from '@suite-native/atoms';
import { mergeNativeStyleObjects, useNativeStyles } from '@trezor/styles';

type AmountTextProps = {
    isDiscreetText?: boolean;
    isForcedDiscreetMode?: boolean;
    value: string | null;
} & TextProps;

export const AmountText = ({
    value,
    isDiscreetText = true,
    style = {},
    ...otherProps
}: AmountTextProps) => {
    const { applyStyle } = useNativeStyles();

    const TextComponent = isDiscreetText ? DiscreetText : Text;

    return (
        <TextComponent
            style={mergeNativeStyleObjects([style, applyStyle(resetLetterSpacingOnAndroidStyle)])}
            {...otherProps}
        >
            {value}
        </TextComponent>
    );
};
