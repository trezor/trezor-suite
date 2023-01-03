import React from 'react';

import { useNativeStyles } from '@trezor/styles';
import { Box, Card, VStack, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';

type TransactionDetailSummaryProps = {
    origin: string;
    target: string;
    transactionStatus: 'confirmed' | 'pending';
};

const TransactionDetailSummaryStepper = () => {
    const { utils } = useNativeStyles();

    return (
        <Box
            style={{
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: utils.colors.gray100,
                width: 16,
                height: 16,
                borderRadius: utils.borders.radii.round,
            }}
        >
            <Box
                style={{
                    width: 4,
                    height: 4,
                    borderRadius: utils.borders.radii.round,
                    backgroundColor: utils.colors.gray400,
                }}
            />
        </Box>
    );
};

const Border = () => {
    const { utils } = useNativeStyles();

    return (
        <Box
            style={{
                borderLeftWidth: 1,
                borderColor: utils.colors.gray400,
                height: 10,
                width: 1,
                marginLeft: utils.spacings.small,
            }}
        />
    );
};

const TransactionDetailSummaryRow = ({ value, title }: { value: string; title: string }) => (
    <Box flexDirection="row" alignItems="center">
        <TransactionDetailSummaryStepper />
        <Box marginLeft="medium">
            <Text color="gray600" variant="hint">
                {title}
            </Text>
            <Text>{value}</Text>
        </Box>
    </Box>
);

export const TransactionDetailSummary = ({
    origin,
    target,
    transactionStatus,
}: TransactionDetailSummaryProps) => {
    const { utils } = useNativeStyles();

    const isTransactionPending = transactionStatus === 'pending';

    return (
        <Card>
            <VStack>
                <TransactionDetailSummaryRow value={origin} title="From" />
                <Border />
                <Box flexDirection="row" alignItems="center">
                    <Box
                        style={{
                            marginLeft: -12,
                            marginRight: utils.spacings.small,
                            backgroundColor: isTransactionPending
                                ? utils.colors.yellow
                                : utils.colors.forest,
                            borderRadius: utils.borders.radii.round,
                            padding: utils.spacings.small,
                        }}
                    >
                        <Icon
                            name={isTransactionPending ? 'clockClockwise' : 'check'}
                            color="gray0"
                        />
                    </Box>
                    <Text
                        style={{ textTransform: 'capitalize' }}
                        color={isTransactionPending ? 'yellow' : 'forest'}
                    >
                        {transactionStatus}
                    </Text>
                </Box>
                <Border />
                <TransactionDetailSummaryRow title="To" value={target} />
            </VStack>
        </Card>
    );
};
