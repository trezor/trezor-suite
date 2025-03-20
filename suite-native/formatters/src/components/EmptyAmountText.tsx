import { Text } from '@suite-native/atoms';
import { NativeTypographyStyle } from '@trezor/theme';

type EmptyAmountTextProps = {
    variant?: NativeTypographyStyle;
};

// The text has to contain a zero width space to have zero width and keep the desired line height.
export const EmptyAmountText = ({ variant }: EmptyAmountTextProps) => (
    // eslint-disable-next-line no-irregular-whitespace
    <Text variant={variant}>​</Text>
);
