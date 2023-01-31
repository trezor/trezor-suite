import React from 'react';

import { Text } from '@suite-native/atoms';
import { parseTransactionMonthKey } from '@suite-common/wallet-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionListGroupProps = {
    monthKey: string;
};

const dateTextStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.medium,
    marginHorizontal: utils.spacings.large,
}));

export const TransactionListGroupTitle = ({ monthKey }: TransactionListGroupProps) => {
    const { applyStyle } = useNativeStyles();
    const sectionTitle = monthKey === 'pending' ? 'Pending' : parseTransactionMonthKey(monthKey);

    return (
        <Text color="gray600" variant="hint" style={applyStyle(dateTextStyle)}>
            {sectionTitle}
        </Text>
    );
};
