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
    borderWidth: 1,
    borderColor: utils.colors.red,
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
}));

const VerticalSeparator = () => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(borderLineStyle)} />;
};

export const RowWithTitle = ({ title, value }: { title: string; value: string }) => (
    <>
        <Text color="gray600" variant="hint">
            {title}
        </Text>
        <Text>{value}</Text>
    </>
);

const SummaryRow = ({
    children,
    leftComponent,
}: {
    children: React.ReactNode;
    leftComponent: React.ReactNode;
}) => (
    <Box flexDirection="row" alignItems="center">
        <Box style={{ width: 40, borderWidth: 1, borderColor: 'red', alignItems: 'center' }}>
            {leftComponent}
        </Box>
        <Box marginLeft="medium">{children}</Box>
    </Box>
);

const confirmationIconStyle = prepareNativeStyle<{ isTransactionPending: boolean }>(
    (utils, { isTransactionPending }) => ({
        backgroundColor: isTransactionPending ? utils.colors.yellow : utils.colors.forest,
        borderRadius: utils.borders.radii.round,
        padding: utils.spacings.small,
        marginVertical: utils.spacings.small,
    }),
);

const cardContentStyle = prepareNativeStyle(utils => ({
    borderColor: 'red',
    borderWidth: 1,
    overflow: 'hidden',
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
                <SummaryRow leftComponent={<TransactionDetailSummaryStepper />}>
                    <RowWithTitle title="From" value={origin} />
                </SummaryRow>

                <SummaryRow
                    leftComponent={
                        <Box
                            alignItems="center"
                            style={{ width: 40, borderWidth: 1, borderColor: 'red' }}
                        >
                            <VerticalSeparator />
                            <Box
                                style={applyStyle(confirmationIconStyle, { isTransactionPending })}
                            >
                                <Icon
                                    name={isTransactionPending ? 'clockClockwise' : 'check'}
                                    color="gray0"
                                />
                            </Box>

                            <VerticalSeparator />
                        </Box>
                    }
                >
                    <Text
                        style={applyStyle(transactionStatusTextStyle)}
                        color={isTransactionPending ? 'yellow' : 'forest'}
                    >
                        {transactionStatus}
                    </Text>
                </SummaryRow>

                <SummaryRow leftComponent={<TransactionDetailSummaryStepper />}>
                    <RowWithTitle title="To" value={target} />
                </SummaryRow>
            </VStack>
        </Card>
    );
};
