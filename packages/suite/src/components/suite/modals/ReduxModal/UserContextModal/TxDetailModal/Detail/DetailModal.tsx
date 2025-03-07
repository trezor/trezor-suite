import { Explorer, getNetwork } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import {
    selectAccountByKey,
    selectExplorer,
    selectIsPhishingTransaction,
} from '@suite-common/wallet-core';
import { Account, ChainedTransactions, WalletAccountTransaction } from '@suite-common/wallet-types';
import { getAccountKey } from '@suite-common/wallet-utils';
import { Modal } from '@trezor/components';

import { AdvancedTxDetails, TabID } from './AdvancedTxDetails/AdvancedTxDetails';
import { useSelector } from '../../../../../../../hooks/suite';
import { Translation } from '../../../../../Translation';
import { TxDetailModalBase } from '../TxDetailModalBase';

type DetailModalProps = {
    tx: WalletAccountTransaction;
    onCancel: () => void;
    tab: TabID | undefined;
    onChangeFeeClick: () => void;
    onCancelTxClick: () => void;
    chainedTxs?: ChainedTransactions;
    canReplaceTransaction: boolean;
    canCancelTransaction: boolean;
};

export const DetailModal = ({
    tx,
    onCancel,
    tab,
    onChangeFeeClick,
    onCancelTxClick,
    chainedTxs,
    canReplaceTransaction,
    canCancelTransaction,
}: DetailModalProps) => {
    const accountKey = getAccountKey(tx.descriptor, tx.symbol, tx.deviceState);
    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const network = getNetwork(account.symbol);
    const explorer = useSelector(state => selectExplorer(state, network.symbol)) as Explorer;
    const isPhishingTransaction = useSelector(state =>
        selectIsPhishingTransaction(state, tx.txid, accountKey),
    );

    return (
        <TxDetailModalBase
            tx={tx}
            onCancel={onCancel}
            heading={<Translation id="TR_TRANSACTION_DETAILS" />}
            bottomContent={
                canReplaceTransaction ? (
                    <>
                        <Modal.Button icon="gauge" variant="tertiary" onClick={onChangeFeeClick}>
                            <Translation id="TR_BUMP_FEE" />
                        </Modal.Button>
                        {canCancelTransaction && (
                            <Modal.Button icon="x" variant="tertiary" onClick={onCancelTxClick}>
                                <Translation id="TR_CANCEL_TX" />
                            </Modal.Button>
                        )}
                    </>
                ) : null
            }
            onBackClick={undefined}
        >
            <AdvancedTxDetails
                explorerUrl={getExplorerUrl(explorer, 'tx')!}
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
