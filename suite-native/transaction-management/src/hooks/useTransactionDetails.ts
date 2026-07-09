import { useSelector } from 'react-redux';

import { getExplorerUrl } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type ExplorerState,
    type TransactionsRootState,
    selectAccountByKey,
    selectExplorer,
    selectIsTransactionPending,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { fetchTransactionForAccount } from '@suite-common/wallet-utils';
import { useOpenLink } from '@suite-native/link';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { useAsyncMemo } from '@trezor/react-utils';

type UseTransactionDetailsParams = {
    accountKey: AccountKey | null;
    txid: string | null;
    tokenContract?: string;
    allowFetchFallback?: boolean;
};

export const useTransactionDetails = ({
    accountKey,
    txid,
    tokenContract,
    allowFetchFallback,
}: UseTransactionDetailsParams) => {
    const openLink = useOpenLink();

    // Try to get the transaction from redux
    const reducerTx = useSelector((state: TransactionsRootState) =>
        accountKey && txid
            ? selectTransactionByAccountKeyAndTxid(state, accountKey, txid)
            : undefined,
    );

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    // If it's not there, fetch the transaction from backend
    const fetchedTx = useAsyncMemo(
        () =>
            !reducerTx && account && txid && allowFetchFallback
                ? fetchTransactionForAccount(txid, account)
                : Promise.resolve(undefined),
        [account, reducerTx, txid, allowFetchFallback],
    );

    const transaction = (fetchedTx ?? reducerTx) as WalletAccountTransaction | null | undefined;

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
