import { useSelector } from 'react-redux';

import { getExplorerUrl } from '@suite-common/wallet-config';
import {
    type ExplorerState,
    type TransactionsRootState,
    selectExplorer,
    selectIsTransactionPending,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useOpenLink } from '@suite-native/link';
import { type WalletAccountTransaction } from '@suite-native/tokens';

type UseTransactionDetailsParams = {
    accountKey: AccountKey | null;
    txid: string | null;
    tokenContract?: string;
};

export const useTransactionDetails = ({
    accountKey,
    txid,
    tokenContract,
}: UseTransactionDetailsParams) => {
    const openLink = useOpenLink();

    const transaction = useSelector((state: TransactionsRootState) =>
        accountKey && txid
            ? (selectTransactionByAccountKeyAndTxid(state, accountKey, txid) as
                  | WalletAccountTransaction
                  | undefined)
            : undefined,
    );

    const blockchainExplorer = useSelector((state: ExplorerState) =>
        selectExplorer(state, transaction?.symbol),
    );

    const isPending = useSelector((state: TransactionsRootState) =>
        accountKey && txid ? selectIsTransactionPending(state, accountKey, txid) : false,
    );

    const tokenTransfer = transaction?.tokens.find(token => token.contract === tokenContract);

    const transactionExplorerUrl =
        blockchainExplorer && transaction
            ? `${getExplorerUrl(blockchainExplorer, 'tx')}${transaction.txid}`
            : null;

    const openInBlockchain = () => {
        if (transactionExplorerUrl) {
            openLink(transactionExplorerUrl);
        }
    };

    return {
        transaction,
        blockchainExplorer,
        isPending,
        tokenTransfer,
        explorerUrl: transactionExplorerUrl,
        openInBlockchain,
    };
};
