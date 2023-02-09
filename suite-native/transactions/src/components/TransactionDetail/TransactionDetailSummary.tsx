import React, { ReactNode } from 'react';

import { useCopyToClipboard } from '@suite-native/helpers';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Card, VStack, Text, ErrorMessage, IconButton } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';
import { AccountAddressFormatter } from '@suite-native/formatters';

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
    backgroundColor: utils.colors.gray400,
    height: 10,
    width: 1,
}));

const VerticalSeparator = () => {
    const { applyStyle } = useNativeStyles();

    return <Box style={applyStyle(borderLineStyle)} />;
};

const addressTextStyle = prepareNativeStyle(() => ({
    width: 160,
}));

export const RowWithTitle = ({ title, value }: { title: string; value: string }) => {
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();

    return (
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <Box>
                <Text color="gray600" variant="hint">
                    {title}
                </Text>
                <AccountAddressFormatter value={value} style={applyStyle(addressTextStyle)} />
            </Box>
            <IconButton
                iconName="copy"
                onPress={() => copyToClipboard(value)}
                colorScheme="tertiary"
                size="medium"
            />
        </Box>
    );
};

const summaryColumnStyle = prepareNativeStyle(_ => ({
    width: 40,
    alignItems: 'center',
}));

const SummaryRow = ({
    children,
    leftComponent,
}: {
    children: ReactNode;
    leftComponent: ReactNode;
}) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row" alignItems="center">
            <Box style={applyStyle(summaryColumnStyle)}>{leftComponent}</Box>
            <Box marginLeft="medium" flex={1}>
                {children}
            </Box>
        </Box>
    );
};

const confirmationIconStyle = prepareNativeStyle<{ isTransactionPending: boolean }>(
    (utils, { isTransactionPending }) => ({
        backgroundColor: isTransactionPending ? utils.colors.yellow : utils.colors.forest,
        borderRadius: utils.borders.radii.round,
        padding: utils.spacings.small,
        marginVertical: utils.spacings.small,
    }),
);

const cardContentStyle = prepareNativeStyle(_ => ({
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

    if (!origin || !target)
        return <ErrorMessage errorMessage="Target and Origin of transaction is unknown." />;

    const isTransactionPending = transactionStatus === 'pending';

    return (
        <Card>
            <VStack style={applyStyle(cardContentStyle)}>
                <SummaryRow leftComponent={<TransactionDetailSummaryStepper />}>
                    <RowWithTitle title="From" value={origin} />
                </SummaryRow>
                <SummaryRow
                    leftComponent={
                        <Box alignItems="center">
                            <VerticalSeparator />
                            <Box
                                style={applyStyle(confirmationIconStyle, { isTransactionPending })}
                            >
                                <Icon
                                    name={isTransactionPending ? 'clockClockwise' : 'confirmation'}
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
