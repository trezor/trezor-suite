import React from 'react';
import { useSelector } from 'react-redux';

import { Box, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';
import { TransactionType } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { useFormatters } from '@suite-common/formatters';

type TransactionDetailHeaderProps = {
    type: TransactionType;
    amount: string;
    fiatAmount: string | null;
};

const transactionTypeTextMap: Partial<Record<TransactionType, string>> = {
    recv: 'received',
    sent: 'sent',
};

const transactionIconMap: Partial<Record<TransactionType, IconName>> = {
    recv: 'receive',
    sent: 'send',
};

const transactionTypeStyle = prepareNativeStyle(utils => ({
    ...utils.typography.titleSmall,
    textTransform: 'capitalize',
    color: utils.colors.forest,
}));

export const TransactionDetailHeader = ({
    type,
    amount,
    fiatAmount,
}: TransactionDetailHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const { FiatAmountFormatter } = useFormatters();
    return (
        <>
            <Box flexDirection="row" marginBottom="small">
                <Icon
                    name={transactionIconMap[type] ?? 'placeholder'}
                    color="forest"
                    size="large"
                />
                <Text style={applyStyle(transactionTypeStyle)}>{transactionTypeTextMap[type]}</Text>
            </Box>
            <Text variant="titleMedium">{amount}</Text>
            <Text variant="label" color="gray700">
                <FiatAmountFormatter currency={fiatCurrency.label} value={fiatAmount ?? 0} />
            </Text>
        </>
    );
};
