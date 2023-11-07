import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormatters } from '@suite-common/formatters';
import {
    selectIsTransactionPending,
    selectTransactionBlockTimeById,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Icon } from '@suite-common/icons';

type TransactionDetailStatusSectionProps = {
    txid: string;
    accountKey: AccountKey;
};

const summaryColumnStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 40,
}));

const statusIconStyle = prepareNativeStyle<{ isTransactionPending: boolean }>(
    (utils, { isTransactionPending }) => ({
        backgroundColor: isTransactionPending
            ? utils.colors.backgroundAlertYellowBold
            : utils.colors.backgroundPrimaryDefault,
        borderRadius: utils.borders.radii.round,
        padding: utils.spacings.s,
        marginVertical: utils.spacings.s,
    }),
);
const borderLineStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundNeutralSubdued,
    height: 25,
    width: 1,
}));

const confirmationContainerStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
}));

const VerticalSeparator = () => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(borderLineStyle)} />;
};

export const SummaryRow = ({
    children,
    leftComponent,
}: {
    children: ReactNode;
    leftComponent: ReactNode;
}) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row">
            <Box style={applyStyle(summaryColumnStyle)}>{leftComponent}</Box>
            <Box marginLeft="m" justifyContent="center" flex={1}>
                {children}
            </Box>
        </Box>
    );
};

export const TransactionDetailStatusSection = ({
    txid,
    accountKey,
}: TransactionDetailStatusSectionProps) => {
    const { applyStyle } = useNativeStyles();
    const { DateTimeFormatter } = useFormatters();

    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, txid, accountKey),
    );

    const isTransactionPending = useSelector((state: TransactionsRootState) =>
        selectIsTransactionPending(state, txid, accountKey),
    );

    return (
        <SummaryRow
            leftComponent={
                <Box alignItems="center">
                    <VerticalSeparator />
                    <Box style={applyStyle(statusIconStyle, { isTransactionPending })}>
                        <Icon
                            name={isTransactionPending ? 'clockClockwise' : 'confirmation'}
                            color="iconOnPrimary"
                        />
                    </Box>
                    <VerticalSeparator />
                </Box>
            }
        >
            <Box style={applyStyle(confirmationContainerStyle)}>
                <Text
                    variant="hint"
                    color={isTransactionPending ? 'textAlertYellow' : 'textPrimaryDefault'}
                >
                    {isTransactionPending ? 'Pending' : 'Confirmed'}
                </Text>
                {!isTransactionPending && (
                    <Text variant="hint" color="textSubdued">
                        <DateTimeFormatter value={transactionBlockTime} />
                    </Text>
                )}
            </Box>
        </SummaryRow>
    );
};
