import { type ReactNode, createContext, useContext, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import {
    type Account,
    type AccountKey,
    type TokenAddress,
    type TransactionReviewStatefulOutput,
    type TransactionReviewSummaryOutput,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type TxKeyPath } from '@suite-native/intl';

interface TransactionReviewRenderSummaryItemProps {
    onLayout: (event: LayoutChangeEvent) => void;
}

type TransactionReviewRenderSummaryItemFn = (
    params: TransactionReviewRenderSummaryItemProps,
) => ReactNode;

type TransactionReviewOutputTitleOverride = (
    output: TransactionReviewStatefulOutput,
) => ReactNode | undefined;

type TransactionReviewOutputOverride = (
    output: TransactionReviewStatefulOutput,
) => ReactNode | undefined;

export interface TransactionReviewProviderProps {
    children: ReactNode;

    outputTitleOverride?: TransactionReviewOutputTitleOverride;
    outputOverride?: TransactionReviewOutputOverride;

    accountKey: AccountKey;
    tokenContract?: TokenAddress;

    reviewOutputs?: TransactionReviewStatefulOutput[];
    summaryOutput?: TransactionReviewSummaryOutput;

    renderSummaryItem?: TransactionReviewRenderSummaryItemFn;
    // Replaces the whole outputs list for review bodies the outputs model
    // cannot express (loading skeleton, message signing, error states).
    renderOutputsList?: () => ReactNode;

    onSendTransaction?: () => Promise<string | undefined>;
    onSendTransactionSuccess?: (txid: string) => void;
    onSendTransactionConfirmed?: (txid: string) => void;

    titleTranslationId: TxKeyPath;
    summaryTranslationId: TxKeyPath;
    sendButtonTranslationId: TxKeyPath;

    sendButtonTestId?: string;
    footerTestId?: string;
    isSendButtonDisabled?: boolean;
    // External override for the send button spinner, for flows whose
    // onSendTransaction only triggers an operation that completes elsewhere.
    isSendButtonLoading?: boolean;

    isSummaryItemEnabled?: boolean;
    isSlidingOverlayEnabled?: boolean;
    isTransactionAlreadySigned: boolean;
}

type TransactionReviewContextType = {
    outputTitleOverride?: TransactionReviewOutputTitleOverride;
    outputOverride?: TransactionReviewOutputOverride;

    account?: Account;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;

    outputs?: TransactionReviewStatefulOutput[];
    summary?: TransactionReviewSummaryOutput;

    renderSummaryItem?: TransactionReviewRenderSummaryItemFn;
    renderOutputsList?: () => ReactNode;

    onSendTransaction?: () => Promise<string | undefined>;
    onSendTransactionSuccess?: (txid: string) => void;
    onSendTransactionConfirmed?: (txid: string) => void;

    titleTranslationId: TxKeyPath;
    summaryTranslationId: TxKeyPath;
    sendButtonTranslationId: TxKeyPath;

    sendButtonTestId?: string;
    footerTestId?: string;
    isSendButtonDisabled?: boolean;
    isSendButtonLoading?: boolean;

    isSummaryItemEnabled: boolean;
    isSlidingOverlayEnabled: boolean;
    isTransactionAlreadySigned: boolean;

    txid: string;
    setTxid: (value: string) => void;
    isSending: boolean;
    setIsSending: (value: boolean) => void;
    transaction?: WalletAccountTransaction;
};

const TransactionReviewContext = createContext<TransactionReviewContextType | undefined>(undefined);

export const TransactionReviewProvider = ({
    children,
    outputTitleOverride,
    outputOverride,
    accountKey,
    tokenContract,
    reviewOutputs,
    summaryOutput,
    renderSummaryItem,
    renderOutputsList,
    onSendTransaction,
    onSendTransactionSuccess,
    onSendTransactionConfirmed,
    titleTranslationId,
    summaryTranslationId,
    sendButtonTranslationId,
    sendButtonTestId,
    footerTestId,
    isSendButtonDisabled,
    isSendButtonLoading,
    isSummaryItemEnabled = true,
    isSlidingOverlayEnabled = true,
    isTransactionAlreadySigned,
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
        outputTitleOverride,
        outputOverride,

        account,
        accountKey,
        tokenContract,

        outputs: reviewOutputs,
        summary: summaryOutput,

        renderSummaryItem,
        renderOutputsList,

        onSendTransaction,
        onSendTransactionSuccess,
        onSendTransactionConfirmed,

        titleTranslationId,
        summaryTranslationId,
        sendButtonTranslationId,

        sendButtonTestId,
        footerTestId,
        isSendButtonDisabled,
        isSendButtonLoading,

        isSummaryItemEnabled,
        isSlidingOverlayEnabled,
        isTransactionAlreadySigned,

        txid,
        setTxid,
        isSending,
        setIsSending,
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
