import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import type { TextProps } from '@suite-native/atoms';
import { Text } from '@suite-native/atoms';

import type { FormatterProps } from '../types';

type TransactionIdFormatterProps = FormatterProps<WalletAccountTransaction['txid']> & TextProps;

export const TransactionIdFormatter = ({ value, ...rest }: TransactionIdFormatterProps) => (
    <Text variant="hint" numberOfLines={1} ellipsizeMode="tail" {...rest}>
        #{value}
    </Text>
);
