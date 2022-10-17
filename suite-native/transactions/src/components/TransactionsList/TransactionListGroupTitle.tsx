import React from 'react';

import { Text } from '@suite-native/atoms';
import { parseDateKey } from '@suite-common/wallet-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionListGroupProps = {
    dateKey: string;
    isPending?: boolean;
};

const dateTextStyle = prepareNativeStyle(_ => ({
    marginBottom: 12,
}));

export const TransactionListGroupTitle = ({
    dateKey,
    isPending = false,
}: TransactionListGroupProps) => {
    const { applyStyle } = useNativeStyles();
    const sectionTitle = isPending ? 'Pending' : parseDateKey(dateKey).toLocaleDateString();

    return (
        <Text color="gray600" variant="hint" style={applyStyle(dateTextStyle)}>
            {sectionTitle}
        </Text>
    );
};
