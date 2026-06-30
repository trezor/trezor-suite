import { Translation } from '@suite/intl';
import { type Explorer, getNetwork } from '@suite-common/wallet-config';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import { selectAccountByKey, selectExplorer } from '@suite-common/wallet-core';
import {
    type Account,
    type ChainedTransactions,
    type WalletAccountTransaction,
    createAccountKey,
} from '@suite-common/wallet-types';
import { type PendingEvmNonceStatus } from '@suite-common/wallet-utils';
import { Modal } from '@trezor/components';
import { GaugeIcon, XIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';

import { TxDetailModalBase } from '../TxDetailModalBase';
import { AdvancedTxDetails, type TabID } from './AdvancedTxDetails/AdvancedTxDetails';

type DetailModalProps = {
    tx: WalletAccountTransaction;
    onCancel: () => void;
    tab: TabID | undefined;
    onChangeFeeClick: () => void;
    onCancelTxClick: () => void;
    chainedTxs?: ChainedTransactions;
    canReplaceTransaction: boolean;
    canCancelTransaction: boolean;
    nonceStatus?: PendingEvmNonceStatus;
    nextNonce?: number;
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
    nonceStatus,
    nextNonce,
}: DetailModalProps) => {
    const accountKey = createAccountKey({
        accountDescriptor: tx.descriptor,
        networkSymbol: tx.symbol,
        deviceStaticSessionId: tx.deviceState,
    });
    const account = useSelector(state => selectAccountByKey(state, accountKey)) as Account;
    const network = getNetwork(account.symbol);
    const explorer = useSelector(state => selectExplorer(state, network.symbol)) as Explorer;

    return (
        <TxDetailModalBase
            tx={tx}
            onCancel={onCancel}
            heading={<Translation id="TR_TRANSACTION_DETAILS" />}
            bottomContent={
                canReplaceTransaction ? (
                    <>
                        <Modal.Button
                            iconLeft={GaugeIcon}
                            intent="neutral"
                            priority="secondary"
                            onClick={onChangeFeeClick}
                        >
                            <Translation id="TR_BUMP_FEE" />
                        </Modal.Button>
                        {canCancelTransaction && (
                            <Modal.Button
                                iconLeft={XIcon}
                                intent="neutral"
                                priority="secondary"
                                onClick={onCancelTxClick}
                            >
                                <Translation id="TR_CANCEL_TX" />
                            </Modal.Button>
                        )}
                    </>
                ) : null
            }
            onBackClick={undefined}
            nonceStatus={nonceStatus}
            nextNonce={nextNonce}
        >
            <AdvancedTxDetails
                explorerUrl={getExplorerUrl(explorer, 'tx')!}
                defaultTab={tab}
                network={network}
                accountType={account.accountType}
                tx={tx}
                chainedTxs={chainedTxs}
            />
        </TxDetailModalBase>
    );
};
