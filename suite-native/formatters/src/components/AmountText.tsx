import { DiscreetText, Text, TextProps } from '@suite-native/atoms';

type AmountTextProps = {
    isDiscreetText?: boolean;
    value: string | null;
} & TextProps;

export const AmountText = ({ value, isDiscreetText = true, ...textProps }: AmountTextProps) => {
    if (isDiscreetText) {
        return <DiscreetText {...textProps}>{value}</DiscreetText>;
    }

    return <Text {...textProps}>{value}</Text>;
};
