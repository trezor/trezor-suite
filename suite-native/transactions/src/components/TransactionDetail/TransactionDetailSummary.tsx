import React from 'react';

import { useNativeStyles } from '@trezor/styles';
import { Box, Card, VStack, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';

type TransactionDetailSummaryProps = {
    origin: string;
    target: string;
    transactionStatus: 'confirmed' | 'pending';
};

const TransactionDetailSummaryStepper = () => <Icon name="warningCircle" />;

const Border = () => {
    const { utils } = useNativeStyles();

    return (
        <Box
            style={{
                borderLeftWidth: 1,
                borderColor: utils.colors.gray400,
                height: 20,
                width: 1,
            }}
        />
    );
};

const TransactionDetailSummaryRow = ({ value, title }: { value: string; title: string }) => (
    <Box flexDirection="row">
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

    return (
        <Card>
            <VStack>
                <TransactionDetailSummaryRow value={origin} title="From" />
                <Border />
                <Box flexDirection="row">
                    <Box
                        style={{
                            backgroundColor: utils.colors.forest,
                            borderRadius: utils.borders.radii.round,
                            padding: utils.spacings.small,
                        }}
                    >
                        <Icon name="check" color="gray0" />
                    </Box>
                    <Text>{transactionStatus}</Text>
                </Box>
                <Border />
                <TransactionDetailSummaryRow title="To" value={target} />
            </VStack>
        </Card>
    );
};
