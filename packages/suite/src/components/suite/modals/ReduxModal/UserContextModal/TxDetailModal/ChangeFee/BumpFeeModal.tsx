import {
    ChainedTransactions,
    SelectedAccountLoaded,
    WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';

import { RbfContext, useRbf } from '../../../../../../../hooks/wallet/useRbfForm';
import { TxDetailModalBase } from '../TxDetailModalBase';
import { Translation } from '../../../../../Translation';
import { ReplaceTxButton } from './ReplaceTxButton';
import { ChangeFee } from './ChangeFee';

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
    const contextValues = useRbf({ rbfParams: tx.rbfParams, chainedTxs, selectedAccount });

    return (
        <RbfContext.Provider value={contextValues}>
            <TxDetailModalBase
                tx={tx}
                onCancel={onCancel}
                heading={<Translation id="TR_TRANSACTION_DETAILS" />}
                bottomContent={<ReplaceTxButton />}
                onBackClick={onBackClick}
            >
                <ChangeFee tx={tx} chainedTxs={chainedTxs} showChained={onShowChained} />
            </TxDetailModalBase>
        </RbfContext.Provider>
    );
};
