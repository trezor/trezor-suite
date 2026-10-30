import { useFormatters } from '@suite-common/formatters';
import {
    type MonthKey,
    parseTransactionDateKey,
    parseTransactionMonthKey,
} from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TransactionListGroupProps = { monthKey: MonthKey } | { dayKey: string };

const dateTextStyle = prepareNativeStyle(({ spacings }) => ({
    marginTop: spacings.sp24,
    marginHorizontal: spacings.sp16,
    marginBottom: spacings.sp12,
}));

export const TransactionListGroupTitle = (props: TransactionListGroupProps) => {
    const { translate } = useTranslate();
    const { MonthNameFormatter, DateFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();

    const groupKey = 'dayKey' in props ? props.dayKey : props.monthKey;

    const formatGroupDate = () =>
        'dayKey' in props
            ? DateFormatter.format(parseTransactionDateKey(props.dayKey))
            : MonthNameFormatter.format(parseTransactionMonthKey(props.monthKey));

    const sectionTitle =
        groupKey === 'pending' ? translate('transactions.status.pending') : formatGroupDate();

    return (
        <Box paddingLeft="sp16">
            <Text color="contentSecondary" variant="body-sm" style={applyStyle(dateTextStyle)}>
                {sectionTitle}
            </Text>
        </Box>
    );
};
