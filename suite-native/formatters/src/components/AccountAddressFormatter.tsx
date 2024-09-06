import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountLabel } from '@suite-common/wallet-core';
import { Text, TextProps } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';

import { FormatterProps } from '../types';

type AccountAddressFormatterProps = FormatterProps<AccountKey> & TextProps;

export const AccountAddressFormatter = ({
    value,
    style,
    ...rest
}: AccountAddressFormatterProps) => {
    const accountLabel = useSelector((state: AccountsRootState) =>
        selectAccountLabel(state, value),
    );

    return (
        <Text numberOfLines={1} ellipsizeMode="middle" style={style} {...rest}>
            {accountLabel || value}
        </Text>
    );
};
