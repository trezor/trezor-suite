import { Text, TextProps } from '@suite-native/atoms';
import { WalletAccountTransaction } from '@suite-common/wallet-types';

import { FormatterProps } from '../types';

type TransactionIdFormatterProps = FormatterProps<WalletAccountTransaction['txid']> & TextProps;

export const TransactionIdFormatter = ({ value, ...rest }: TransactionIdFormatterProps) => (
    <Text variant="hint" numberOfLines={1} ellipsizeMode="tail" {...rest}>
        #{value}
    </Text>
);
