import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { Text, TextProps } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles, mergeNativeStyleObjects } from '@trezor/styles';

import { FormatterProps } from '../types';

type AccountAddressFormatterProps = FormatterProps<AccountKey> & TextProps;

const addressStyle = prepareNativeStyle(_ => ({
    // ellipsizeMode="middle" is not working on Android with negative letterSpacing defined in @trezor/theme typography.
    extend: {
        condition: Platform.OS === 'android',
        style: {
            letterSpacing: 0,
        },
    },
}));

export const AccountAddressFormatter = ({
    value,
    style,
    ...rest
}: AccountAddressFormatterProps) => {
    const { applyStyle } = useNativeStyles();
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, value),
    );

    const baseAddressStyle = applyStyle(addressStyle);
    const mergedAddressStyle = style
        ? mergeNativeStyleObjects([style, baseAddressStyle])
        : baseAddressStyle;

    return (
        <Text numberOfLines={1} ellipsizeMode="middle" style={mergedAddressStyle} {...rest}>
            {accountLabel || value}
        </Text>
    );
};
