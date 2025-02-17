import { selectTransactionConfirmations } from '@suite-common/wallet-core';
import {
    ChainedTransactions,
    SelectedAccountLoaded,
    WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';
import { NewModal } from '@trezor/components';

import { ChangeFee } from './ChangeFee';
import { ReplaceTxButton } from './ReplaceTxButton';
import { useSelector } from '../../../../../../../hooks/suite';
import { RbfContext, useRbf } from '../../../../../../../hooks/wallet/useRbfForm';
import { Translation } from '../../../../../Translation';
import { ReplaceByFeeFailedOriginalTxConfirmed } from '../ReplaceByFeeFailedOriginalTxConfirmed';
import { TxDetailModalBase } from '../TxDetailModalBase';

type BumpFeeModalProps = {
    tx: WalletAccountTransactionWithRequiredRbfParams;
    onCancel: () => void;
    onBackClick: () => void;
    onShowChained: () => void;
    chainedTxs?: ChainedTransactions;
    selectedAccount: SelectedAccountLoaded;
};

export const BumpFeeModal = ({
    tx,
    onCancel,
    onBackClick,
    onShowChained,
    chainedTxs,
    selectedAccount,
}: BumpFeeModalProps) => {
    const { account } = selectedAccount;
    const contextValues = useRbf({ rbfParams: tx.rbfParams, chainedTxs, selectedAccount });

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
                        <NewModal.Button variant="tertiary" onClick={onCancel}>
                            <Translation id="TR_CLOSE_WINDOW" />
                        </NewModal.Button>
                    ) : (
                        <ReplaceTxButton />
                    )
                }
                onBackClick={onBackClick}
            >
                {isTxConfirmed ? (
                    <ReplaceByFeeFailedOriginalTxConfirmed
                        type="bump-fee"
                        networkSymbol={tx.symbol}
                        networkType={account.networkType}
                    />
                ) : (
                    <ChangeFee tx={tx} chainedTxs={chainedTxs} showChained={onShowChained} />
                )}
            </TxDetailModalBase>
        </RbfContext.Provider>
    );
};
