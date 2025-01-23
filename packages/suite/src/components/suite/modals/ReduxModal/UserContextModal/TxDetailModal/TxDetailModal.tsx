import { useState, useMemo } from 'react';

import { isPending, findChainedTransactions, getAccountKey } from '@suite-common/wallet-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { selectAccountByKey, selectAllPendingTransactions } from '@suite-common/wallet-core';
import { WalletAccountTransactionWithRequiredRbfParams } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';

import { TabID } from './Detail/AdvancedTxDetails/AdvancedTxDetails';
import { BumpFeeModal } from './ChangeFee/BumpFeeModal';
import { DetailModal } from './Detail/DetailModal';

const hasRbfParams = (
    tx: WalletAccountTransaction,
): tx is WalletAccountTransactionWithRequiredRbfParams => tx.rbfParams !== undefined;

type TxDetailModalProps = {
    tx: WalletAccountTransaction;
    flow: 'detail' | 'bump-fee';
    onCancel: () => void;
};

export const TxDetailModal = ({ tx, flow, onCancel }: TxDetailModalProps) => {
    const [section, setSection] = useState<TxDetailModalProps['flow']>(flow);
    const [tab, setTab] = useState<TabID | undefined>(undefined);

    const accountKey = getAccountKey(tx.descriptor, tx.symbol, tx.deviceState);
    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const network = getNetwork(account.symbol);
    const networkFeatures = network.accountTypes[account.accountType]?.features ?? network.features;
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const transactions = useSelector(selectAllPendingTransactions);
    // const confirmations = getConfirmations(tx, blockchain.blockHeight);
    // TODO: replace this part will be refactored after blockbook implementation:
    // https://github.com/trezor/blockbook/issues/555
    const chainedTxs = useMemo(() => {
        if (!isPending(tx)) return;

        return findChainedTransactions(tx.descriptor, tx.txid, transactions);
    }, [tx, transactions]);

    const onBackClick = () => {
        setSection('detail');
        setTab(undefined);
    };

    const onShowChained = () => {
        setSection('detail');
        setTab('chained');
    };

    const onChangeFeeClick = () => {
        setSection('bump-fee');
        setTab(undefined);
    };

    const canReplaceTransaction =
        hasRbfParams(tx) &&
        networkFeatures?.includes('rbf') &&
        !tx.deadline &&
        selectedAccount.status === 'loaded';

    if (section === 'bump-fee' && canReplaceTransaction) {
        return (
            <BumpFeeModal
                tx={tx}
                onCancel={onCancel}
                onBackClick={onBackClick}
                onShowChained={onShowChained}
                chainedTxs={chainedTxs}
                selectedAccount={selectedAccount}
            />
        );
    }

    return (
        <DetailModal
            tx={tx}
            onCancel={onCancel}
            tab={tab}
            onChangeFeeClick={onChangeFeeClick}
            chainedTxs={chainedTxs}
            canReplaceTransaction={canReplaceTransaction}
        />
    );
};
