import React, { memo } from 'react';

import { Box, Text } from '@suite-native/atoms';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { Icon, IconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type AccountTransactionListItemProps = {
    transaction: WalletAccountTransaction;
};

type TransactionType = Pick<WalletAccountTransaction, 'type'>['type'];
const transactionIconMap: Partial<Record<TransactionType, IconName>> = {
    recv: 'receive',
    sent: 'send',
};

const iconStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray300,
    padding: utils.spacings.small,
    borderRadius: utils.borders.radii.round,
    marginRight: utils.spacings.small,
}));

const transactionListItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: utils.spacings.medium,
}));

export const TransactionListItem = memo(({ transaction }: AccountTransactionListItemProps) => {
    const { applyStyle } = useNativeStyles();

    const getTransactionTimestamp = () => {
        const { blockHeight, blockTime } = transaction;
        if (!blockTime || blockHeight === 0) return null;
        // TODO this is just MVP and should be properly formatted in next PR
        return new Date(blockTime * 1000);
    };

    return (
        <Box style={applyStyle(transactionListItemStyle)}>
            <Box flexDirection="row" alignItems="center">
                <Box style={applyStyle(iconStyle)}>
                    <Icon name={transactionIconMap[transaction.type] ?? 'placeholder'} />
                </Box>
                <Box>
                    <Text>{transaction.type}</Text>
                    <Text>{getTransactionTimestamp()?.toLocaleTimeString()}</Text>
                </Box>
            </Box>
            <Text>
                {transaction.amount} {transaction.symbol}
            </Text>
        </Box>
    );
});
