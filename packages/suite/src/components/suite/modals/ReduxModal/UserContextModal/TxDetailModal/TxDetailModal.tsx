import { useState, useMemo } from 'react';

import { NewModal } from '@trezor/components';
import { isPending, findChainedTransactions, getAccountKey } from '@suite-common/wallet-utils';
import { getNetwork } from '@suite-common/wallet-config';
import {
    selectAccountByKey,
    selectAllPendingTransactions,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import {
    ChainedTransactions,
    SelectedAccountLoaded,
    WalletAccountTransactionWithRequiredRbfParams,
} from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';
import { RbfContext, useRbf } from 'src/hooks/wallet/useRbfForm';

import { AdvancedTxDetails, TabID } from './AdvancedTxDetails/AdvancedTxDetails';
import { ChangeFee } from './ChangeFee/ChangeFee';
import { ReplaceTxButton } from './ChangeFee/ReplaceTxButton';
import { TxDetailModalBase } from './TxDetailModalBase';

const hasRbfParams = (
    tx: WalletAccountTransaction,
): tx is WalletAccountTransactionWithRequiredRbfParams => tx.rbfParams !== undefined;

type DetailModalProps = {
    tx: WalletAccountTransaction;
    onCancel: () => void;
    tab: TabID | undefined;
    onChangeFeeClick: () => void;
    chainedTxs?: ChainedTransactions;
    canBumpFee: boolean;
};

const DetailModal = ({
    tx,
    onCancel,
    tab,
    onChangeFeeClick,
    chainedTxs,
    canBumpFee,
}: DetailModalProps) => {
    const accountKey = getAccountKey(tx.descriptor, tx.symbol, tx.deviceState);
    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const network = getNetwork(account.symbol);
    const isPhishingTransaction = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );
    const blockchain = useSelector(state => state.wallet.blockchain[tx.symbol]);

    return (
        <TxDetailModalBase
            tx={tx}
            onCancel={onCancel}
            heading={<Translation id="TR_TRANSACTION_DETAILS" />}
            bottomContent={
                canBumpFee ? (
                    <NewModal.Button variant="tertiary" onClick={onChangeFeeClick}>
                        <Translation id="TR_BUMP_FEE" />
                    </NewModal.Button>
                ) : null
            }
            onBackClick={undefined}
        >
            <AdvancedTxDetails
                explorerUrl={blockchain.explorer.tx}
                defaultTab={tab}
                network={network}
                accountType={account.accountType}
                tx={tx}
                chainedTxs={chainedTxs}
                isPhishingTransaction={isPhishingTransaction}
            />
        </TxDetailModalBase>
    );
};

type BumpFeeModalProps = {
    tx: WalletAccountTransactionWithRequiredRbfParams;
    onCancel: () => void;
    onBackClick: () => void;
    onShowChained: () => void;
    chainedTxs?: ChainedTransactions;
    selectedAccount: SelectedAccountLoaded;
};

const BumpFeeModal = ({
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

type TxDetailModalProps = {
    tx: WalletAccountTransaction;
    rbfForm?: boolean;
    onCancel: () => void;
};

export const TxDetailModal = ({ tx, rbfForm, onCancel }: TxDetailModalProps) => {
    const [section, setSection] = useState<'CHANGE_FEE' | 'DETAILS'>(
        rbfForm ? 'CHANGE_FEE' : 'DETAILS',
    );
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
        setSection('DETAILS');
        setTab(undefined);
    };

    const onShowChained = () => {
        setSection('DETAILS');
        setTab('chained');
    };

    const onChangeFeeClick = () => {
        setSection('CHANGE_FEE');
        setTab(undefined);
    };

    const canBumpFee =
        hasRbfParams(tx) &&
        networkFeatures?.includes('rbf') &&
        !tx.deadline &&
        selectedAccount.status === 'loaded';

    if (section === 'CHANGE_FEE' && canBumpFee) {
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
            canBumpFee={canBumpFee}
        />
    );
};
