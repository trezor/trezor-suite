import { useMemo, useRef, useState } from 'react';

import { Translation } from '@suite/intl';
import { getInstantStakeType } from '@suite-common/staking';
import { getNetwork } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectAllPendingTransactions,
    selectTransactionByAccountKeyAndTxid,
    useEvmNonceInfo,
} from '@suite-common/wallet-core';
import {
    type WalletAccountTransactionWithRequiredRbfParams,
    createAccountKey,
} from '@suite-common/wallet-types';
import {
    findChainedTransactions,
    getPendingEvmNonceStatus,
    isPending,
    isSignedByAccount,
    isTransactionBumpable,
    isTransactionCancellable,
} from '@suite-common/wallet-utils';
import { Modal } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { CancelTransactionModal } from './CancelTransaction/CancelTransactionModal';
import { BumpFeeModal } from './ChangeFee/BumpFeeModal';
import { type TabID } from './Detail/AdvancedTxDetails/AdvancedTxDetails';
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
    showCancelButton?: boolean;
    onCancel: () => void;
};

export const TxDetailModal = ({
    txid,
    descriptor,
    symbol,
    deviceState,
    flow,
    showCancelButton,
    onCancel,
}: TxDetailModalProps) => {
    const [section, setSection] = useState<TxDetailModalProps['flow']>(flow);
    const [tab, setTab] = useState<TabID | undefined>(undefined);

    const accountKey = createAccountKey({
        accountDescriptor: descriptor,
        networkSymbol: symbol,
        deviceStaticSessionId: deviceState,
    });
    const originalTx = useSelector(state =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    );

    // A confirming (or replaced) tx is briefly evicted from the store: fetchAndUpdateAccountThunk
    // dispatches removeTransaction before re-adding the confirmed record, so this selector returns
    // null for a render or two. Without retention that flashes a "Transaction not found" error when
    // the user opens this modal just as the tx confirms. Keep the last-known copy so a transient
    // disappearance keeps the modal alive; once the confirmed record re-appears the cancel flow
    // shows its "already confirmed" state (see isTxConfirmed in CancelTransactionModal).
    const lastKnownTxRef = useRef(originalTx);
    if (originalTx) {
        lastKnownTxRef.current = originalTx;
    }
    const resolvedTx = originalTx ?? lastKnownTxRef.current;

    // Filter out internal transfers that are instant staking transactions
    const filteredInternalTransfers = useMemo(() => {
        if (!resolvedTx) return [];

        return resolvedTx.internalTransfers.filter(t => {
            const stakeType = getInstantStakeType(t, descriptor, symbol);

            return stakeType !== 'stake';
        });
    }, [resolvedTx, descriptor, symbol]);

    const tx = useMemo(() => {
        if (!resolvedTx) return null;

        return {
            ...resolvedTx,
            internalTransfers: filteredInternalTransfers,
        };
    }, [resolvedTx, filteredInternalTransfers]);

    const account = useSelector(state => selectAccountByKey(state, accountKey));
    const nonceAccount = account?.networkType === 'ethereum' ? account : undefined;
    const { nonceInfo: fetchedNonceInfo } = useEvmNonceInfo(nonceAccount);

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

    if (tx === null || !account) {
        return (
            <Modal onCancel={onCancel} heading={<Translation id="TR_TRANSACTION_DETAILS" />}>
                <Translation id="TR_TRANSACTION_NOT_FOUND" />
            </Modal>
        );
    }

    const network = getNetwork(account.symbol);
    const networkFeatures = network.accountTypes[account.accountType]?.features ?? network.features;

    // A pending EVM tx whose own nonce is gapped or already superseded can't be bumped OR
    // cancelled — both re-send at this same nonce, which would land on a nonce that either can't
    // confirm yet or already confirmed elsewhere (the network would reject a cancel attempt as
    // "nonce too low"). Same check the account's transaction list uses (see TransactionItem.tsx).
    // Computed once here and threaded down through DetailModal/BumpFeeModal/CancelTransactionModal
    // to TxDetailModalBase, instead of each of those independently re-fetching/recomputing it.
    const evmNonce = network.networkType === 'ethereum' ? tx.ethereumSpecific?.nonce : undefined;
    const pendingEvmNonce = isPending(tx) && isSignedByAccount(tx) ? evmNonce : undefined;
    const nonceStatus =
        pendingEvmNonce !== undefined && fetchedNonceInfo
            ? getPendingEvmNonceStatus(pendingEvmNonce, fetchedNonceInfo)
            : 'ok';
    const isNonceStuck = nonceStatus !== 'ok';

    const canReplaceTransaction = hasRbfParams(tx) && isTransactionBumpable(tx, networkFeatures);

    // Cancel is only offered from the account transaction list (which reflects the cancel once
    // it's broadcast). Other entry points open this modal without `showCancelButton`, so the
    // Cancel button stays hidden there. Bump-fee is intentionally not gated this way.
    const canCancelTransaction =
        isTransactionCancellable(tx, isPending(tx), networkFeatures) &&
        !isNonceStuck &&
        !!showCancelButton;

    if (section === 'bump-fee' && canReplaceTransaction && !isNonceStuck) {
        return (
            <BumpFeeModal
                tx={tx}
                onCancel={onCancel}
                onBackClick={onBackClick}
                onShowChained={onShowChained}
                chainedTxs={chainedTxs}
                account={account}
                nonceStatus={nonceStatus}
                nextNonce={fetchedNonceInfo?.nextNonce}
            />
        );
    }

    if (section === 'cancel-transaction' && hasRbfParams(tx) && canCancelTransaction) {
        return (
            <CancelTransactionModal
                tx={tx}
                onCancel={onCancel}
                onBackClick={onBackClick}
                onShowChained={onShowChained}
                chainedTxs={chainedTxs}
                account={account}
                nonceStatus={nonceStatus}
                nextNonce={fetchedNonceInfo?.nextNonce}
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
            canReplaceTransaction={canReplaceTransaction && !isNonceStuck}
            canCancelTransaction={canCancelTransaction}
            nonceStatus={nonceStatus}
            nextNonce={fetchedNonceInfo?.nextNonce}
        />
    );
};
