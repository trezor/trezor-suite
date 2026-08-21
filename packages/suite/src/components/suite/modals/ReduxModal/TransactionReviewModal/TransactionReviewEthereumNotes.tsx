import { Translation } from '@suite/intl';
import {
    selectResolvedEthereumNonce,
    selectStablecoinYieldTxReview,
    selectStake,
    selectTronStakeTxReview,
} from '@suite-common/wallet-core';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { getFee, hasEip1559MaxPriorityFee, isEip1559 } from '@suite-common/wallet-utils';
import { Note, Text } from '@trezor/components';
import { CheckCircleIcon, GasPumpIcon } from '@trezor/icons';
import { FeeRate } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite/useSelector';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';

type TransactionReviewEthereumNotesProps = {
    account: Account & { networkType: 'ethereum' };
    tx: GeneralPrecomposedTransactionFinal;
};

// The nonce shown must come from the flow whose transaction is actually under review. This mirrors
// getReviewSource() in TransactionReviewModal.tsx and keys off each flow's own precomposedTx, so a
// nonce resolved for one flow can never leak into another's review (each flow only sets its own
// state). Every flow resolves the exact signed-with nonce before the device button-request fires,
// so it's normally set by the time this modal renders; the Note simply doesn't render until then.
const selectReviewEthereumNonce = (state: AppState) => {
    if (selectTronStakeTxReview(state).precomposedTx) return undefined; // TRON has no EVM nonce
    const yieldTxReview = selectStablecoinYieldTxReview(state);
    if (yieldTxReview.precomposedTx) return yieldTxReview.precomposedForm?.ethereumNonce;
    if (state.wallet.send?.precomposedTx) {
        // Send stores the resolved nonce; WalletConnect fills precomposedForm instead.
        return (
            selectResolvedEthereumNonce(state) ?? state.wallet.send.precomposedForm?.ethereumNonce
        );
    }

    return selectStake(state).resolvedEthereumNonce; // staking (getReviewSource default branch)
};

export const TransactionReviewEthereumNotes = ({
    account,
    tx,
}: TransactionReviewEthereumNotesProps) => {
    const ethereumNonce = useSelector(selectReviewEthereumNonce);

    const fee = getFee(account.networkType, tx);

    return (
        <>
            {ethereumNonce !== undefined && (
                <Note data-testid="@modal/header/nonce" icon={CheckCircleIcon}>
                    <Translation id="TR_NONCE" />
                    {': '}
                    <Text data-testid="@modal/header/nonce/value">{ethereumNonce}</Text>
                </Note>
            )}
            <Note data-testid="@modal/header/gas-limit" icon={GasPumpIcon}>
                <Translation id="TR_GAS_LIMIT" />
                {': '}
                <Text data-testid="@modal/header/gas-limit/value">{tx.feeLimit}</Text>
            </Note>
            <Note data-testid="@modal/header/fee-per-gas" icon={GasPumpIcon}>
                <Translation id={isEip1559(tx) ? 'TR_MAX_FEE_PER_GAS' : 'TR_GAS_PRICE'} />
                {': '}
                <FeeRate feeRate={fee} networkType={account.networkType} />
            </Note>
            {hasEip1559MaxPriorityFee(tx) && (
                <Note data-testid="@modal/header/priority-fee" icon={GasPumpIcon}>
                    <Translation id="TR_MAX_PRIORITY_FEE_PER_GAS" />
                    {': '}
                    <FeeRate feeRate={tx.maxPriorityFeePerGas} networkType={account.networkType} />
                </Note>
            )}
        </>
    );
};
