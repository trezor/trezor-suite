import { useFormatters } from '@suite-common/formatters';
import { MonthKey, parseTransactionMonthKey } from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionListGroupProps = {
    monthKey: MonthKey;
};

const dateTextStyle = prepareNativeStyle(({ spacings }) => ({
    marginTop: spacings.sp24,
    marginHorizontal: spacings.sp16,
    marginBottom: spacings.sp12,
}));

export const TransactionListGroupTitle = ({ monthKey }: TransactionListGroupProps) => {
    const { translate } = useTranslate();
    const { MonthNameFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();

    const sectionTitle =
        monthKey === 'pending'
            ? translate('transactions.status.pending')
            : MonthNameFormatter.format(parseTransactionMonthKey(monthKey));

    return (
        <Box paddingLeft="sp16">
            <Text color="textSubdued" variant="hint" style={applyStyle(dateTextStyle)}>
                {sectionTitle}
            </Text>
        </Box>
    );
};
