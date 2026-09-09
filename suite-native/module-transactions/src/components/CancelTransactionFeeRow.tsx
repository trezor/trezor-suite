import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';

import { TransactionDetailRow } from './TransactionDetailRow';

type CancelTransactionFeeRowProps = {
    title: string;
    fee: string;
    symbol: WalletAccountTransaction['symbol'];
};

export const CancelTransactionFeeRow = ({ title, fee, symbol }: CancelTransactionFeeRowProps) => (
    <TransactionDetailRow title={title}>
        <Box alignItems="flex-end">
            <CryptoAmountFormatter
                value={fee}
                symbol={symbol}
                variant="body-sm"
                color="contentPrimary"
                isBalance={false}
            />
            <CryptoToFiatAmountFormatter
                value={fee}
                symbol={symbol}
                variant="body-sm"
                color="contentSecondary"
            />
        </Box>
    </TransactionDetailRow>
);
