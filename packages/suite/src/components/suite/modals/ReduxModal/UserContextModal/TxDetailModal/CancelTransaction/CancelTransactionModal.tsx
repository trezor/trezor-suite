import { useEffect, useState } from 'react';

import {
    ComposeCancelTransactionPartialAccount,
    composeCancelTransactionThunk,
    selectTransactionConfirmations,
} from '@suite-common/wallet-core';
import {
    Account,
    ChainedTransactions,
    SelectedAccountLoaded,
    WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { Banner, Button, Column } from '@trezor/components';
import { PrecomposeResultFinal } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { CancelTransaction } from './CancelTransaction';
import { CancelTransactionButton } from './CancelTransactionButton';
import { useDispatch, useSelector } from '../../../../../../../hooks/suite';
import { CancelTxContext } from '../../../../../../../hooks/wallet/useCancelTxContext';
import { Translation } from '../../../../../Translation';
import { AffectedTransactions } from '../AffectedTransactions/AffectedTransactions';
import { ReplaceByFeeFailedOriginalTxConfirmed } from '../ReplaceByFeeFailedOriginalTxConfirmed';
import { TxDetailModalBase } from '../TxDetailModalBase';

const isComposeCancelTransactionPartialAccount = (
    account: Account,
): account is Account & ComposeCancelTransactionPartialAccount =>
    account.addresses !== undefined && account.utxo !== undefined;

type CancelTransactionModalProps = {
    tx: WalletAccountTransactionWithRequiredRbfParams;
    onCancel: () => void;
    onBackClick: () => void;
    onShowChained: () => void;
    chainedTxs?: ChainedTransactions;
    selectedAccount: SelectedAccountLoaded;
};

export const CancelTransactionModal = ({
    tx,
    onCancel,
    onBackClick,
    onShowChained,
    chainedTxs,
    selectedAccount,
}: CancelTransactionModalProps) => {
    const [error, setError] = useState<string | null>(null);
    const { account } = selectedAccount;

    const dispatch = useDispatch();
    const [composedCancelTx, setComposedCancelTx] = useState<PrecomposeResultFinal | null>(null);

    const confirmations = useSelector(state =>
        selectTransactionConfirmations(state, tx.txid, account.key),
    );

    const isTxConfirmed = confirmations > 0;

    useEffect(() => {
        if (tx.vsize === undefined) {
            return;
        }

        if (!isComposeCancelTransactionPartialAccount(account)) {
            return;
        }

        dispatch(composeCancelTransactionThunk({ account, tx, chainedTxs }))
            .unwrap()
            .then(setComposedCancelTx)
            .catch(setError);
    }, [account, tx, dispatch, chainedTxs]);

    return (
        <CancelTxContext.Provider value={{ composedCancelTx }}>
            <TxDetailModalBase
                tx={tx}
                onCancel={onCancel}
                heading={<Translation id="TR_TRANSACTION_DETAILS" />}
                bottomContent={
                    isTxConfirmed ? (
                        <Button variant="tertiary" onClick={onCancel}>
                            <Translation id="TR_CLOSE_WINDOW" />
                        </Button>
                    ) : (
                        <>
                            <CancelTransactionButton account={selectedAccount.account} />
                            {error !== null ? (
                                // This shall never happen, error like this always signal big in the code,
                                // this is here just to make easier to detect and fix
                                <Banner variant="destructive">
                                    Error: transaction cannot be canceled ({error})
                                </Banner>
                            ) : null}
                        </>
                    )
                }
                onBackClick={onBackClick}
            >
                {isTxConfirmed ? (
                    <ReplaceByFeeFailedOriginalTxConfirmed type="cancel-transaction" />
                ) : (
                    <Column gap={spacings.md}>
                        <CancelTransaction tx={tx} selectedAccount={selectedAccount} />
                        <AffectedTransactions showChained={onShowChained} chainedTxs={chainedTxs} />
                    </Column>
                )}
            </TxDetailModalBase>
        </CancelTxContext.Provider>
    );
};
