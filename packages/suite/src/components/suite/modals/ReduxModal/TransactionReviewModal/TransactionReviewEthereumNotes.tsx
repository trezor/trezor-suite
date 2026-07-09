import { Translation } from '@suite/intl';
import { selectResolvedEthereumNonce } from '@suite-common/wallet-core';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { getFee, hasEip1559MaxPriorityFee, isEip1559 } from '@suite-common/wallet-utils';
import { Note } from '@trezor/components';
import { CheckCircleIcon, GasPumpIcon } from '@trezor/icons';
import { FeeRate } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite/useSelector';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';

type TransactionReviewEthereumNotesProps = {
    account: Account & { networkType: 'ethereum' };
    tx: GeneralPrecomposedTransactionFinal;
};

const selectPrecomposedFormEthereumNonce = (state: AppState) =>
    state.wallet.send.precomposedForm?.ethereumNonce;

export const TransactionReviewEthereumNotes = ({
    account,
    tx,
}: TransactionReviewEthereumNotesProps) => {
    const precomposedFormEthereumNonce = useSelector(selectPrecomposedFormEthereumNonce);
    // signEthereumSendFormTransactionThunk stores the exact signed-with nonce before the device
    // button-request fires, so it's normally already set by the time this modal renders. Until
    // then, fall back to the nonce captured at compose time (a custom override, if any) instead of
    // re-resolving it independently — this modal only displays the nonce, it never signs with it,
    // and the Note below simply doesn't render until one of the two is available.
    const storedEthereumNonce = useSelector(selectResolvedEthereumNonce);
    const ethereumNonce = storedEthereumNonce ?? precomposedFormEthereumNonce;

    const fee = getFee(account.networkType, tx);

    return (
        <>
            {ethereumNonce !== undefined && (
                <Note data-testid="@modal/ethereum/nonce" icon={CheckCircleIcon}>
                    <Translation id="TR_NONCE" />
                    {': '}
                    {ethereumNonce}
                </Note>
            )}
            <Note data-testid="@modal/ethereum/gas-limit" icon={GasPumpIcon}>
                <Translation id="TR_GAS_LIMIT" />
                {': '}
                {tx.feeLimit}
            </Note>
            <Note data-testid="@modal/ethereum/fee" icon={GasPumpIcon}>
                <Translation id={isEip1559(tx) ? 'TR_MAX_FEE_PER_GAS' : 'TR_GAS_PRICE'} />
                {': '}
                <FeeRate feeRate={fee} networkType={account.networkType} />
            </Note>
            {hasEip1559MaxPriorityFee(tx) && (
                <Note data-testid="@modal/ethereum/priority-fee" icon={GasPumpIcon}>
                    <Translation id="TR_MAX_PRIORITY_FEE_PER_GAS" />
                    {': '}
                    <FeeRate feeRate={tx.maxPriorityFeePerGas} networkType={account.networkType} />
                </Note>
            )}
        </>
    );
};
