import { Translation } from '@suite/intl';
import { useResolveTransactionInputs } from '@suite-common/wallet-core';
import { getFeeRate } from '@suite-common/wallet-utils';
import { Spinner, Tooltip } from '@trezor/components';

import { FeeRate } from 'src/components/wallet/Fees/FeeRate';
import { type WalletAccountTransaction } from 'src/types/wallet';

type TransactionFeeRateProps = {
    tx: WalletAccountTransaction;
};

export const TransactionFeeRate = ({ tx }: TransactionFeeRateProps) => {
    // The fee of a transaction with foreign inputs may be unknown until they are fetched.
    const { isResolving, hasFailed } = useResolveTransactionInputs([tx]);

    if (hasFailed) {
        return <Translation id="TR_UNKNOWN" />;
    }

    if (isResolving) {
        return (
            <Tooltip cursor="pointer" content={<Translation id="TR_LOADING_TRANSACTION_DETAILS" />}>
                <Spinner size={16} isDisabled={true} />
            </Tooltip>
        );
    }

    // tx.feeRate was added in @trezor/blockchain-link 2.1.5 meaning that users might have locally
    // saved old transactions without this field. since we cant reliably migrate this data, we are
    // keeping old way of displaying feeRate in place
    return <FeeRate feeRate={tx.feeRate ? tx.feeRate : getFeeRate(tx)} networkType="bitcoin" />;
};
