import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import {
    type ComposeCancelTransactionPartialAccount,
    composeCancelTransactionThunk,
    selectTransactionConfirmations,
} from '@suite-common/wallet-core';
import {
    type Account,
    type ChainedTransactions,
    type PrecomposedTransactionFinalCancelRbf,
    type SelectedAccountLoaded,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { Banner, Column, Modal } from '@trezor/components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { CancelTxContext } from 'src/hooks/wallet/useCancelTxContext';
import { useEthereumCancelTxCompose } from 'src/hooks/wallet/useEthereumCancelTxCompose';

import { CancelTransaction } from './CancelTransaction';
import { CancelTransactionButton } from './CancelTransactionButton';
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
    const { account } = selectedAccount;
    const dispatch = useDispatch();

    const {
        composedCancelTx: ethComposedCancelTx,
        cancelFormState,
        error: ethError,
    } = useEthereumCancelTxCompose({ account, tx });

    const [utxoComposedCancelTx, setUtxoComposedCancelTx] =
        useState<PrecomposedTransactionFinalCancelRbf | null>(null);
    const [utxoError, setUtxoError] = useState<string | null>(null);

    const composedCancelTx =
        account.networkType === 'ethereum' ? ethComposedCancelTx : utxoComposedCancelTx;
    const error = account.networkType === 'ethereum' ? ethError : utxoError;
    const isComposing = composedCancelTx === null && error === null;

    const confirmations = useSelector(state =>
        selectTransactionConfirmations(state, tx.txid, account.key),
    );

    const isTxConfirmed = confirmations > 0;

    useEffect(() => {
        if (account.networkType === 'ethereum') return;
        if (tx.vsize === undefined) return;
        if (!isComposeCancelTransactionPartialAccount(account)) return;

        dispatch(composeCancelTransactionThunk({ account, tx, chainedTxs }))
            .unwrap()
            .then(precomposed => {
                setUtxoComposedCancelTx({ ...precomposed, rbfType: 'cancel', prevTxid: tx.txid });
            })
            .catch(setUtxoError);
    }, [account, tx, dispatch, chainedTxs]);

    return (
        <CancelTxContext.Provider value={{ composedCancelTx, cancelFormState, isComposing }}>
            <TxDetailModalBase
                tx={tx}
                onCancel={onCancel}
                heading={<Translation id="TR_TRANSACTION_DETAILS" />}
                bottomContent={
                    isTxConfirmed ? (
                        <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                            <Translation id="TR_CLOSE_WINDOW" />
                        </Modal.Button>
                    ) : (
                        <>
                            <CancelTransactionButton
                                account={selectedAccount.account}
                                onSuccess={onCancel}
                            />
                            {error !== null ? (
                                // This shall never happen, error like this always signal big in the code,
                                // this is here just to make easier to detect and fix
                                <Banner
                                    intent="critical"
                                    description={
                                        <Translation
                                            id="TR_CANCEL_TX_GENERIC_ERROR"
                                            values={{ error }}
                                        />
                                    }
                                />
                            ) : null}
                        </>
                    )
                }
                onBackClick={onBackClick}
            >
                {isTxConfirmed ? (
                    <ReplaceByFeeFailedOriginalTxConfirmed
                        type="cancel"
                        networkType={account.networkType}
                    />
                ) : (
                    <Column gap={16}>
                        <CancelTransaction tx={tx} selectedAccount={selectedAccount} />
                        <AffectedTransactions showChained={onShowChained} chainedTxs={chainedTxs} />
                    </Column>
                )}
            </TxDetailModalBase>
        </CancelTxContext.Provider>
    );
};
