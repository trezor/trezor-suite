import {
    DiscreetText,
    Text,
    TextProps,
    resetLetterSpacingOnAndroidStyle,
} from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles';

type AmountTextProps = {
    isDiscreetText?: boolean;
    isForcedDiscreetMode?: boolean;
    value: string | null;
} & TextProps;

export const AmountText = ({ value, isDiscreetText = true, ...otherProps }: AmountTextProps) => {
    const { applyStyle } = useNativeStyles();

    const TextComponent = isDiscreetText ? DiscreetText : Text;

    return (
        <TextComponent style={applyStyle(resetLetterSpacingOnAndroidStyle)} {...otherProps}>
            {value}
        </TextComponent>
    );
};
