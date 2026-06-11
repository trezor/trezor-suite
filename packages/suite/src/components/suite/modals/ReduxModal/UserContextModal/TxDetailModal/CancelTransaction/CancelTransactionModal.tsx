import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeCancelTransactionPartialAccount,
    composeCancelTransactionThunk,
    composeSendFormTransactionFeeLevelsThunk,
    selectConvertedNetworkFeeInfo,
    selectTransactionConfirmations,
} from '@suite-common/wallet-core';
import {
    type Account,
    type ChainedTransactions,
    type FormState,
    type PrecomposedTransactionFinalCancelRbf,
    type RbfTransactionParamsEthereum,
    type SelectedAccountLoaded,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { Banner, Column, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { CancelTxContext } from 'src/hooks/wallet/useCancelTxContext';

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
    const [error, setError] = useState<string | null>(null);
    const { account } = selectedAccount;

    const dispatch = useDispatch();
    const [composedCancelTx, setComposedCancelTx] =
        useState<PrecomposedTransactionFinalCancelRbf | null>(null);
    const [cancelFormState, setCancelFormState] = useState<FormState | null>(null);

    const confirmations = useSelector(state =>
        selectTransactionConfirmations(state, tx.txid, account.key),
    );
    const feeInfo = useSelector(state => selectConvertedNetworkFeeInfo(state, account.symbol));

    const isTxConfirmed = confirmations > 0;

    useEffect(() => {
        if (account.networkType === 'ethereum') {
            if (!feeInfo || tx.rbfParams?.type !== 'ethereum') {
                return;
            }

            const rbfParams = tx.rbfParams as RbfTransactionParamsEthereum;
            const network = getNetwork(account.symbol);

            const formState: FormState = {
                outputs: [
                    {
                        type: 'payment',
                        address: account.descriptor,
                        amount: '0',
                        fiat: '',
                        currency: { value: '', label: '' },
                        token: null,
                    },
                ],
                selectedFee: 'normal',
                feePerUnit: '',
                feeLimit: '',
                options: ['broadcast'],
                isCoinControlEnabled: false,
                hasCoinControlBeenOpened: false,
                selectedUtxos: [],
                rbfParams,
            };

            dispatch(
                composeSendFormTransactionFeeLevelsThunk({
                    formState,
                    composeContext: { account, network, feeInfo },
                }),
            )
                .unwrap()
                .then(feeLevels => {
                    const normalLevel = feeLevels.normal;
                    if (!normalLevel || normalLevel.type === 'error') {
                        setError('Unable to compose a valid cancellation fee level.');

                        return;
                    }
                    setComposedCancelTx({
                        ...normalLevel,
                        rbfType: 'cancel',
                        prevTxid: tx.txid,
                    });
                    setCancelFormState(formState);
                })
                .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : 'Unknown error'),
                );

            return;
        }

        if (tx.vsize === undefined) {
            return;
        }

        if (!isComposeCancelTransactionPartialAccount(account)) {
            return;
        }

        dispatch(composeCancelTransactionThunk({ account, tx, chainedTxs }))
            .unwrap()
            .then(precomposed => {
                setComposedCancelTx({ ...precomposed, rbfType: 'cancel', prevTxid: tx.txid });
            })
            .catch(setError);
    }, [account, tx, dispatch, chainedTxs, feeInfo]);

    return (
        <CancelTxContext.Provider value={{ composedCancelTx, cancelFormState }}>
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
                            <CancelTransactionButton account={selectedAccount.account} />
                            {error !== null ? (
                                // This shall never happen, error like this always signal big in the code,
                                // this is here just to make easier to detect and fix
                                <Banner
                                    intent="critical"
                                    description={
                                        <>Error: transaction cannot be canceled ({error})</>
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
                    <Column gap={spacings.md}>
                        <CancelTransaction tx={tx} selectedAccount={selectedAccount} />
                        <AffectedTransactions showChained={onShowChained} chainedTxs={chainedTxs} />
                    </Column>
                )}
            </TxDetailModalBase>
        </CancelTxContext.Provider>
    );
};
