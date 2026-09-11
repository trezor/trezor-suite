import {
    AccountsRootState,
    selectAccountByKey,
    selectTransactionByAccountKeyAndTxid,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import {
    Account,
    AccountKey,
    FormDraftWithSendKeyPrefix,
    TokenAddress,
    TransactionReviewStatefulOutput,
    TransactionReviewSummaryOutput,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { TxKeyPath } from '@suite-native/intl';
import { ExchangeFlowType } from '@suite-native/navigation';
import { createContext, ReactNode, useContext, useState } from 'react';
import { useSelector } from 'react-redux';

type TransactionReviewContextType = {
    prefix: FormDraftWithSendKeyPrefix;
    account?: Account;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    outputs?: TransactionReviewStatefulOutput[];
    summary?: TransactionReviewSummaryOutput;
    flowType?: ExchangeFlowType;
    titleTranslationId: TxKeyPath;
    summaryTranslationId: TxKeyPath;
    sendButtonTranslationId: TxKeyPath;
    isTransactionAlreadySigned: boolean;
    isClearSignedTradingSwap?: boolean;

    txid: string;
    setTxid: (value: string) => void;
    isSending: boolean;
    setIsSending: (value: boolean) => void;

    onSendTransaction?: () => Promise<string | undefined>;
    onSendTransactionSuccess?: (txid: string) => void;

    transaction?: WalletAccountTransaction;
};

const TransactionReviewContext = createContext<TransactionReviewContextType | undefined>(undefined);

export interface TransactionReviewProviderProps {
    children: ReactNode;
    prefix: FormDraftWithSendKeyPrefix;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    reviewOutputs?: TransactionReviewStatefulOutput[];
    summaryOutput?: TransactionReviewSummaryOutput;
    flowType?: ExchangeFlowType;
    titleTranslationId: TxKeyPath;
    summaryTranslationId: TxKeyPath;
    sendButtonTranslationId: TxKeyPath;
    isTransactionAlreadySigned: boolean;
    isClearSignedTradingSwap?: boolean;

    onSendTransaction?: () => Promise<string | undefined>;
    onSendTransactionSuccess?: (txid: string) => void;
}

export const TransactionReviewProvider = ({
    children,
    prefix,
    accountKey,
    tokenContract,
    reviewOutputs,
    summaryOutput,
    flowType,
    titleTranslationId,
    summaryTranslationId,
    sendButtonTranslationId,
    isTransactionAlreadySigned,
    isClearSignedTradingSwap,
    onSendTransaction,
    onSendTransactionSuccess,
}: TransactionReviewProviderProps) => {
    const account = useSelector(
        (state: AccountsRootState) => selectAccountByKey(state, accountKey) ?? undefined,
    );

    const [txid, setTxid] = useState<string>('');
    const [isSending, setIsSending] = useState(false);

    const transaction = useSelector((state: TransactionsRootState) =>
        account
            ? (selectTransactionByAccountKeyAndTxid(state, account.key, txid) ?? undefined)
            : undefined,
    );

    const context = {
        prefix,
        account,
        accountKey,
        tokenContract,
        outputs: reviewOutputs,
        summary: summaryOutput,
        flowType,
        titleTranslationId,
        summaryTranslationId,
        sendButtonTranslationId,
        isTransactionAlreadySigned,
        isClearSignedTradingSwap,

        txid,
        setTxid,
        isSending,
        setIsSending,

        onSendTransaction,
        onSendTransactionSuccess,

        transaction,
    };

    return (
        <TransactionReviewContext.Provider value={context}>
            {children}
        </TransactionReviewContext.Provider>
    );
};

export const useTransactionReview = () => {
    const context = useContext(TransactionReviewContext);

    if (!context) {
        throw new Error('useTransactionReview must be used within a TransactionReviewContext');
    }

    return context;
};
