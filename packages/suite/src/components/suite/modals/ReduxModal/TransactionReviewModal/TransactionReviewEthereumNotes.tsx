import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import {
    ethereumGetCurrentNonceThunk,
    selectResolvedEthereumNonce,
} from '@suite-common/wallet-core';
import { type GeneralPrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { getFee, hasEip1559MaxPriorityFee, isEip1559 } from '@suite-common/wallet-utils';
import { Note } from '@trezor/components';
import { FeeRate } from '@trezor/product-components';

import { useDispatch } from 'src/hooks/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { type Account } from 'src/types/wallet';

type TransactionReviewEthereumNotesProps = {
    account: Account & { networkType: 'ethereum' };
    tx: GeneralPrecomposedTransactionFinal;
};

export const TransactionReviewEthereumNotes = ({
    account,
    tx,
}: TransactionReviewEthereumNotesProps) => {
    const dispatch = useDispatch();
    const precomposedFormEthereumNonce = useSelector(
        state => state.wallet.send.precomposedForm?.ethereumNonce,
    );
    // In the normal flow the signing thunk stores this before the device button-request fires, so
    // the modal reads the already-resolved value. The local fallback below covers edge cases where
    // the modal renders before the thunk has stored it (e.g. in tests, or slow device response).
    const storedEthereumNonce = useSelector(selectResolvedEthereumNonce);
    const [resolvedNonce, setResolvedNonce] = useState<string>();
    const ethereumNonce = storedEthereumNonce ?? resolvedNonce;

    useEffect(() => {
        if (storedEthereumNonce !== undefined) return;

        if (precomposedFormEthereumNonce) {
            setResolvedNonce(precomposedFormEthereumNonce);

            return;
        }

        const promise = dispatch(
            ethereumGetCurrentNonceThunk({
                selectedAccount: account,
                fetchConfirmedNonce: true,
            }),
        );

        void promise
            .unwrap()
            .then(({ nonce }) => setResolvedNonce(nonce))
            .catch(() => {});

        return () => {
            promise.abort();
        };
    }, [account, dispatch, precomposedFormEthereumNonce, storedEthereumNonce]);

    const fee = getFee(account.networkType, tx);

    return (
        <>
            {ethereumNonce !== undefined && (
                <Note data-testid="@modal/ethereum/nonce" iconName="receipt">
                    <Translation id="TR_NONCE" />
                    {': '}
                    {ethereumNonce}
                </Note>
            )}
            <Note data-testid="@modal/ethereum/gas-limit" iconName="gasPump">
                <Translation id="TR_GAS_LIMIT" />
                {': '}
                {tx.feeLimit}
            </Note>
            <Note data-testid="@modal/ethereum/fee" iconName="gasPump">
                {isEip1559(tx) ? (
                    <Translation id="TR_MAX_FEE_PER_GAS" />
                ) : (
                    <Translation id="TR_GAS_PRICE" />
                )}
                {': '}
                <FeeRate feeRate={fee} networkType={account.networkType} />
            </Note>
            {hasEip1559MaxPriorityFee(tx) ? (
                <Note data-testid="@modal/ethereum/priority-fee" iconName="gasPump">
                    <Translation id="TR_MAX_PRIORITY_FEE_PER_GAS" />
                    {': '}
                    <FeeRate feeRate={tx.maxPriorityFeePerGas} networkType={account.networkType} />
                </Note>
            ) : undefined}
        </>
    );
};
