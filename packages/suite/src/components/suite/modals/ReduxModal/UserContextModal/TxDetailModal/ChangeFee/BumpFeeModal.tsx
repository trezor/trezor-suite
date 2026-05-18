import { Translation } from '@suite/intl';
import { selectTransactionConfirmations } from '@suite-common/wallet-core';
import {
    type Account,
    type ChainedTransactions,
    type WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { Modal } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { RbfContext, useRbf } from 'src/hooks/wallet/useRbfForm';

import { ChangeFee } from './ChangeFee';
import { ReplaceTxButton } from './ReplaceTxButton';
import { ReplaceByFeeFailedOriginalTxConfirmed } from '../ReplaceByFeeFailedOriginalTxConfirmed';
import { TxDetailModalBase } from '../TxDetailModalBase';

type BumpFeeModalProps = {
    tx: WalletAccountTransactionWithRequiredRbfParams;
    onCancel: () => void;
    onBackClick: () => void;
    onShowChained: () => void;
    chainedTxs?: ChainedTransactions;
    account: Account;
};

export const BumpFeeModal = ({
    tx,
    onCancel,
    onBackClick,
    onShowChained,
    chainedTxs,
    account,
}: BumpFeeModalProps) => {
    const contextValues = useRbf({ rbfParams: tx.rbfParams, chainedTxs, account });

    const confirmations = useSelector(state =>
        selectTransactionConfirmations(state, tx.txid, account.key),
    );

    const isTxConfirmed = confirmations > 0;

    return (
        <RbfContext.Provider value={contextValues}>
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
                        <ReplaceTxButton />
                    )
                }
                onBackClick={onBackClick}
            >
                {isTxConfirmed ? (
                    <ReplaceByFeeFailedOriginalTxConfirmed
                        type="bump-fee"
                        networkType={account.networkType}
                    />
                ) : (
                    <ChangeFee tx={tx} showChained={onShowChained} />
                )}
            </TxDetailModalBase>
        </RbfContext.Provider>
    );
};
