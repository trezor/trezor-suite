import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormatters } from '@suite-common/formatters';
import { MonthKey, parseTransactionMonthKey } from '@suite-common/wallet-utils';

type TransactionListGroupProps = {
    monthKey: MonthKey;
};

const dateTextStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.medium,
    marginHorizontal: utils.spacings.medium,
}));

export const TransactionListGroupTitle = ({ monthKey }: TransactionListGroupProps) => {
    const { applyStyle } = useNativeStyles();
    const { MonthNameFormatter } = useFormatters();
    const sectionTitle =
        monthKey === 'pending'
            ? 'Pending'
            : MonthNameFormatter.format(parseTransactionMonthKey(monthKey));

    return (
        <Box paddingLeft="s">
            <Text color="textSubdued" variant="hint" style={applyStyle(dateTextStyle)}>
                {sectionTitle}
            </Text>
        </Box>
    );
};
