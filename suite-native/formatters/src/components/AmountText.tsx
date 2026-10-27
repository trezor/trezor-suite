import {
    BlurUrls,
    DiscreetText,
    Text,
    type TextProps,
    resetLetterSpacingOnAndroidStyle,
} from '@suite-native/atoms';
import { mergeNativeStyleObjects, useNativeStyles } from '@trezor/styles-native';

type AmountTextProps = {
    isDiscreetText?: boolean;
    isForcedDiscreetMode?: boolean;
    shouldBlurUrls?: boolean;
    value: string | null;
} & TextProps;

export const AmountText = ({
    value,
    isDiscreetText = true,
    shouldBlurUrls = false,
    style = {},
    ...otherProps
}: AmountTextProps) => {
    const { applyStyle } = useNativeStyles();

    const textProps = {
        style: mergeNativeStyleObjects([style, applyStyle(resetLetterSpacingOnAndroidStyle)]),
        ...otherProps,
    };

    if (isDiscreetText) {
        return (
            <DiscreetText shouldBlurUrls={shouldBlurUrls} {...textProps}>
                {value}
            </DiscreetText>
        );
    }

    if (shouldBlurUrls && value !== null) {
        return <BlurUrls text={value} {...textProps} />;
    }

    return <Text {...textProps}>{value}</Text>;
};
