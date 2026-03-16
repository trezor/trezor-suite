import { Platform } from 'react-native';

import { Text, type TextProps } from '@suite-native/atoms';
import { mergeNativeStyleObjects, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { type FormatterProps } from '../types';

type AddressFormatterProps = FormatterProps<string> & TextProps;

const addressStyle = prepareNativeStyle(_ => ({
    // ellipsizeMode="middle" is not working on Android with negative letterSpacing defined in @trezor/theme typography.
    extend: {
        condition: Platform.OS === 'android',
        style: {
            letterSpacing: 0,
        },
    },
}));

export const AddressFormatter = ({ value, style, ...rest }: AddressFormatterProps) => {
    const { applyStyle } = useNativeStyles();

    const baseAddressStyle = applyStyle(addressStyle);
    const mergedAddressStyle = style
        ? mergeNativeStyleObjects([style, baseAddressStyle])
        : baseAddressStyle;

    return (
        <Text numberOfLines={1} ellipsizeMode="middle" style={mergedAddressStyle} {...rest}>
            {value}
        </Text>
    );
};
