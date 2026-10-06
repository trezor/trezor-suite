import { useTranslation } from '@suite/intl';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { calculateTronFeeBreakdown } from '@suite-common/wallet-utils';
import { Note } from '@trezor/components';
import { ReceiptIcon } from '@trezor/icons';

import { FormattedCryptoAmount } from 'src/components/suite';
import { type Account } from 'src/types/wallet';

type TransactionReviewTronFeeNotesProps = {
    tx: GeneralPrecomposedTransactionFinal;
    account: Account;
};

export const TransactionReviewTronFeeNotes = ({
    tx,
    account,
}: TransactionReviewTronFeeNotesProps) => {
    const { translationString } = useTranslation();

    const tronResources = account.networkType === 'tron' ? account.misc.tronResources : undefined;
    const { trxBurned, coveredEnergy, coveredBandwidth } =
        calculateTronFeeBreakdown(tx, tronResources, account.symbol) ?? {};

    return (
        <>
            {trxBurned && !trxBurned.isZero() && (
                <Note data-testid="@modal/header/tron-burned" icon={ReceiptIcon}>
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={trxBurned.toString()}
                        symbol={account.symbol}
                    />
                </Note>
            )}
            {coveredBandwidth?.gt(0) && (
                <Note data-testid="@modal/header/tron-bandwidth" icon={ReceiptIcon}>
                    {translationString('TR_TRON_FEE_BANDWIDTH', {
                        count: coveredBandwidth.toNumber(),
                    })}
                </Note>
            )}
            {coveredEnergy?.gt(0) && (
                <Note data-testid="@modal/header/tron-energy" icon={ReceiptIcon}>
                    {translationString('TR_TRON_FEE_ENERGY', {
                        count: coveredEnergy.toNumber(),
                    })}
                </Note>
            )}
        </>
    );
};
