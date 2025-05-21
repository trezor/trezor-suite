import { useMemo, useState } from 'react';

import { getNetwork } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectAllPendingTransactions,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { WalletAccountTransactionWithRequiredRbfParams } from '@suite-common/wallet-types';
import { findChainedTransactions, getAccountKey, isPending } from '@suite-common/wallet-utils';
import { Modal } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';
import { getInstantStakeType } from 'src/utils/suite/ethereumStaking';

import { CancelTransactionModal } from './CancelTransaction/CancelTransactionModal';
import { BumpFeeModal } from './ChangeFee/BumpFeeModal';
import { TabID } from './Detail/AdvancedTxDetails/AdvancedTxDetails';
import { DetailModal } from './Detail/DetailModal';

const hasRbfParams = (
    tx: WalletAccountTransaction,
): tx is WalletAccountTransactionWithRequiredRbfParams => tx.rbfParams !== undefined;

type TxDetailModalProps = {
    txid: string;
    descriptor: Account['descriptor'];
    symbol: Account['symbol'];
    deviceState: Account['deviceState'];
    flow: 'detail' | 'bump-fee' | 'cancel-transaction';
    onCancel: () => void;
};

export const TxDetailModal = ({
    txid,
    descriptor,
    symbol,
    deviceState,
    flow,
    onCancel,
}: TxDetailModalProps) => {
    const [section, setSection] = useState<TxDetailModalProps['flow']>(flow);
    const [tab, setTab] = useState<TabID | undefined>(undefined);

    const accountKey = getAccountKey(descriptor, symbol, deviceState);
    const originalTx = useSelector(state =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    );

    // Filter out internal transfers that are instant staking transactions
    const filteredInternalTransfers = useMemo(() => {
        if (!originalTx) return [];

        return originalTx.internalTransfers.filter(t => {
            const stakeType = getInstantStakeType(t, descriptor, symbol);

            return stakeType !== 'stake';
        });
    }, [originalTx, descriptor, symbol]);

    const tx = useMemo(() => {
        if (!originalTx) return null;

        return {
            ...originalTx,
            internalTransfers: filteredInternalTransfers,
        };
    }, [originalTx, filteredInternalTransfers]);

    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const network = getNetwork(account.symbol);
    const networkFeatures = network.accountTypes[account.accountType]?.features ?? network.features;
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const transactions = useSelector(selectAllPendingTransactions);
    // const confirmations = getConfirmations(tx, blockchain.blockHeight);
    // TODO: replace this part will be refactored after blockbook implementation:
    // https://github.com/trezor/blockbook/issues/555
    const chainedTxs = useMemo(() => {
        if (!tx) return;
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

    const onCancelTxClick = () => {
        setSection('cancel-transaction');
        setTab(undefined);
    };

    if (tx === null) {
        return (
            <Modal onCancel={onCancel} heading={<Translation id="TR_TRANSACTION_DETAILS" />}>
                <Translation id="TR_TRANSACTION_NOT_FOUND" />
            </Modal>
        );
    }

    const canReplaceTransaction =
        hasRbfParams(tx) &&
        networkFeatures?.includes('rbf') &&
        !tx.deadline &&
        selectedAccount.status === 'loaded';

    const canCancelTransaction = network.networkType === 'bitcoin';

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

    if (section === 'cancel-transaction' && canReplaceTransaction) {
        return (
            <CancelTransactionModal
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
            onCancelTxClick={onCancelTxClick}
            chainedTxs={chainedTxs}
            canReplaceTransaction={canReplaceTransaction}
            canCancelTransaction={canCancelTransaction}
        />
    );
};
