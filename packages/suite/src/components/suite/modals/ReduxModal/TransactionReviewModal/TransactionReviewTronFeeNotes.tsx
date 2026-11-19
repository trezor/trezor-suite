import { useTranslation } from '@suite/intl';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { calculateTronFeeBreakdown } from '@suite-common/wallet-utils';
import { Note } from '@trezor/components';
import { ReceiptIcon } from '@trezor/icons';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { getTronFeeLimitSun } from '#src/components/wallet/Fees/feeUtils';
import { type Account } from '#src/types/wallet';

type TransactionReviewTronFeeNotesProps = {
    tx: GeneralPrecomposedTransactionFinal;
    account: Account;
    formFeeLimit: string | undefined;
};

export const TransactionReviewTronFeeNotes = ({
    tx,
    account,
    formFeeLimit,
}: TransactionReviewTronFeeNotesProps) => {
    const { translationString } = useTranslation();

    const tronResources = account.networkType === 'tron' ? account.misc.tronResources : undefined;
    const feeLimitSun = getTronFeeLimitSun({ tx, formFeeLimit });
    const { trxBurned, coveredEnergy, coveredBandwidth } =
        calculateTronFeeBreakdown(tx, tronResources, account.symbol, feeLimitSun) ?? {};

    return (
        <>
            {trxBurned && !trxBurned.isZero() && (
                <Note data-testid="@modal/header/tron-burned" icon={ReceiptIcon}>
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={trxBurned.toString()}
                        networkSymbol={account.symbol}
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
