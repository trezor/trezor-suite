import { hasUnresolvedInputs } from '@suite-common/wallet-utils';
import { Box } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { TransactionDetailUnknownValue } from './TransactionDetailUnknownValue';

type TransactionDetailFeeProps = {
    transaction: WalletAccountTransaction;
    historicRate?: number;
};

export const TransactionDetailFee = ({ transaction, historicRate }: TransactionDetailFeeProps) => {
    // The fee of a transaction with foreign inputs is unknown until they are fetched.
    if (hasUnresolvedInputs(transaction)) {
        return <TransactionDetailUnknownValue />;
    }

    return (
        <Box alignItems="flex-end">
            <ExactCryptoAmountFormatter
                value={transaction.fee}
                symbol={transaction.symbol}
                variant="body-sm"
                color="contentPrimary"
                isBalance={false}
            />
            {historicRate !== undefined && historicRate !== 0 && (
                <Box flexDirection="row">
                    <CryptoToFiatAmountFormatter
                        value={transaction.fee}
                        symbol={transaction.symbol}
                        historicRate={historicRate}
                        useHistoricRate
                        variant="body-sm"
                        color="contentSecondary"
                    />
                </Box>
            )}
        </Box>
    );
};
