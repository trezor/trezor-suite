import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { type WalletAccountTransaction } from '@suite-native/tokens';

import { TransactionDetailStepper } from './TransactionDetailStepper';
import { SummaryRow } from './TransactionSummaryRow';

type TransactionDetailStellarTrustlineSummaryProps = {
    transaction: WalletAccountTransaction;
};

export const TransactionDetailStellarTrustlineSummary = ({
    transaction,
}: TransactionDetailStellarTrustlineSummaryProps) => {
    const changeTrust = transaction.stellarSpecific?.changeTrust;

    if (!changeTrust) {
        return null;
    }

    const { assetCode, isRemoval } = changeTrust;
    const translationId = isRemoval
        ? 'transactions.detail.stellarTrustlineRemoved'
        : 'transactions.detail.stellarTrustlineAdded';

    return (
        <SummaryRow leftComponent={<TransactionDetailStepper />}>
            <Box>
                <Text color="textSubdued" variant="body-sm">
                    {assetCode}
                </Text>
                <Text variant="body-md" color="textDefault">
                    <Translation id={translationId} values={{ assetCode }} />
                </Text>
            </Box>
        </SummaryRow>
    );
};
