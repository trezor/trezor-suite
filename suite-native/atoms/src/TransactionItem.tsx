import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';
import { capitalizeFirstLetter } from '@trezor/utils';

import { Box } from './Box';
import { Text } from './Text';

type TransactionStatus = 'received' | 'sent';

const transactionStatusSigns: Record<TransactionStatus, string> = {
    received: '+',
    sent: '-',
};

type TransactionItemProps = {
    cryptoCurrencySymbol: string;
    amountInCrypto: number;
    amountInFiat: number;
    transactionStatus: TransactionStatus;
};

const transactionItemWrapperStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.medium,
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
}));

const iconWrapperStyle = prepareNativeStyle(utils => ({
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: utils.spacings.small,
    backgroundColor: utils.colors.gray300,
    borderRadius: utils.borders.radii.round,
}));

const transactionSignStyle = prepareNativeStyle<{ transactionStatus: TransactionStatus }>(
    (utils, { transactionStatus }) => ({
        ...utils.typography.hint,
        marginRight: utils.spacings.small,
        extend: [
            { condition: transactionStatus === 'received', style: { color: utils.colors.forest } },
            { condition: transactionStatus === 'sent', style: { color: utils.colors.red } },
        ],
    }),
);

const FIAT_CURRENCY = 'Kc'; // Note: This will probably change and will be passed from selector

export const TransactionItem = ({
    cryptoCurrencySymbol,
    amountInFiat,
    amountInCrypto,
    transactionStatus,
}: TransactionItemProps) => {
    const { applyStyle } = useNativeStyles();

    const getFormattedTitle = (): string =>
        `${capitalizeFirstLetter(transactionStatus)} ${cryptoCurrencySymbol}`;

    return (
        <Box style={applyStyle(transactionItemWrapperStyle)}>
            <Box style={applyStyle(iconWrapperStyle)}>
                <Icon name="receive" color="gray700" size="medium" />
            </Box>
            <Box flexDirection="row" justifyContent="space-between" flex={1}>
                <Box>
                    <Text>{getFormattedTitle()}</Text>
                    <Text variant="hint" color="gray600">
                        {cryptoCurrencySymbol}
                    </Text>
                </Box>
                <Box alignItems="flex-end">
                    <Box flexDirection="row" alignItems="center">
                        <Text style={applyStyle(transactionSignStyle, { transactionStatus })}>
                            {transactionStatusSigns[transactionStatus]}
                        </Text>
                        <Text variant="hint">{`${amountInFiat} ${FIAT_CURRENCY}`}</Text>
                    </Box>
                    <Text variant="hint" color="gray600">
                        {`${amountInCrypto} ${cryptoCurrencySymbol}`}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};
