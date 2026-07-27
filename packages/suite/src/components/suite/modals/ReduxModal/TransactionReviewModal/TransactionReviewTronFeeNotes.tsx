import { useTranslation } from '@suite/intl';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    calculateTronFeeBreakdown,
    subunitsToUnits,
} from '@suite-common/wallet-utils';
import { Note } from '@trezor/components';
import { ReceiptIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

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

    const accountActivationFee = 'accountActivationFee' in tx ? tx.accountActivationFee : undefined;

    const totalTrxBurned =
        trxBurned && accountActivationFee
            ? trxBurned.plus(
                  new BigNumber(
                      subunitsToUnits({
                          value: asAmountSubunit(new BigNumber(accountActivationFee)),
                          symbol: account.symbol,
                      }),
                  ),
              )
            : trxBurned;

    return (
        <>
            {totalTrxBurned && !totalTrxBurned.isZero() && (
                <Note icon={ReceiptIcon}>
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={totalTrxBurned.toString()}
                        symbol={account.symbol}
                    />
                </Note>
            )}
            {coveredBandwidth?.gt(0) && (
                <Note icon={ReceiptIcon}>
                    {translationString('TR_TRON_FEE_BANDWIDTH', {
                        count: coveredBandwidth.toNumber(),
                    })}
                </Note>
            )}
            {coveredEnergy?.gt(0) && (
                <Note icon={ReceiptIcon}>
                    {translationString('TR_TRON_FEE_ENERGY', {
                        count: coveredEnergy.toNumber(),
                    })}
                </Note>
            )}
        </>
    );
};
