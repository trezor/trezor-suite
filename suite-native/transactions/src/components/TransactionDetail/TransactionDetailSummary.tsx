import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Card, VStack, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';

type TransactionDetailSummaryProps = {
    origin?: string;
    target?: string;
    transactionStatus: 'confirmed' | 'pending';
};

const stepperDotWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: utils.colors.gray100,
    width: 16,
    height: 16,
    borderRadius: utils.borders.radii.round,
}));

const stepperDotStyle = prepareNativeStyle(utils => ({
    width: 4,
    height: 4,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.gray400,
}));

const TransactionDetailSummaryStepper = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(stepperDotWrapperStyle)}>
            <Box style={applyStyle(stepperDotStyle)} />
        </Box>
    );
};

const borderLineStyle = prepareNativeStyle(utils => ({
    borderLeftWidth: 1,
    borderColor: utils.colors.gray400,
    height: 10,
    width: 1,
    marginLeft: utils.spacings.small,
}));

const VerticalSeparator = () => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(borderLineStyle)} />;
};

const TransactionDetailSummaryRow = ({ value, title }: { value: string; title: string }) => (
    <Box flexDirection="row" alignItems="center">
        <TransactionDetailSummaryStepper />
        <Box marginLeft="medium">
            <Text color="gray600" variant="hint">
                {title}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="middle" style={{ maxWidth: 160 }}>
                {value}
            </Text>
        </Box>
    </Box>
);

const confirmationIconStyle = prepareNativeStyle<{ isTransactionPending: boolean }>(
    (utils, { isTransactionPending }) => ({
        marginLeft: -12,
        marginRight: utils.spacings.small,
        backgroundColor: isTransactionPending ? utils.colors.yellow : utils.colors.forest,
        borderRadius: utils.borders.radii.round,
        padding: utils.spacings.small,
    }),
);

const cardContentStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
}));

const transactionStatusTextStyle = prepareNativeStyle(() => ({
    textTransform: 'capitalize',
}));

export const TransactionDetailSummary = ({
    origin,
    target,
    transactionStatus,
}: TransactionDetailSummaryProps) => {
    const { applyStyle } = useNativeStyles();

    if (!origin || !target) return null;

    const isTransactionPending = transactionStatus === 'pending';

    return (
        <Card>
            <VStack style={applyStyle(cardContentStyle)}>
                <TransactionDetailSummaryRow value={origin} title="From" />
                <VerticalSeparator />
                <Box flexDirection="row" alignItems="center">
                    <Box style={applyStyle(confirmationIconStyle, { isTransactionPending })}>
                        <Icon
                            name={isTransactionPending ? 'clockClockwise' : 'check'}
                            color="gray0"
                        />
                    </Box>
                    <Text
                        style={applyStyle(transactionStatusTextStyle)}
                        color={isTransactionPending ? 'yellow' : 'forest'}
                    >
                        {transactionStatus}
                    </Text>
                </Box>
                <VerticalSeparator />
                <TransactionDetailSummaryRow title="To" value={target} />
            </VStack>
        </Card>
    );
};
