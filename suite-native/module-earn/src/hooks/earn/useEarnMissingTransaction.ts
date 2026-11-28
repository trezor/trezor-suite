import { useEffect, useRef, useState } from 'react';

import { useAtomValue } from 'jotai';

import { type Alert, alertAtom, useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

const MISSING_TRANSACTION_GRACE_MS = 2 * 60 * 1000;

type UseEarnMissingTransactionParams = {
    txid: string | undefined;
    submittedAt: number | undefined;
    hasTrackedTransaction: boolean;
    isFocused: boolean;
};

export const useEarnMissingTransaction = ({
    txid,
    submittedAt,
    hasTrackedTransaction,
    isFocused,
}: UseEarnMissingTransactionParams) => {
    const { showAlert, hideAlert } = useAlert();
    const activeAlert = useAtomValue(alertAtom);
    const { translate } = useTranslate();
    const warningRef = useRef<Alert | null>(null);
    const acknowledgedTxidRef = useRef<string | undefined>(undefined);
    const [overdueTxid, setOverdueTxid] = useState(() =>
        submittedAt !== undefined && submittedAt + MISSING_TRANSACTION_GRACE_MS <= Date.now()
            ? txid
            : undefined,
    );

    useEffect(() => {
        if (!txid) return undefined;

        const remainingGraceMs =
            submittedAt === undefined
                ? MISSING_TRANSACTION_GRACE_MS
                : Math.max(submittedAt + MISSING_TRANSACTION_GRACE_MS - Date.now(), 0);
        const timeout = setTimeout(() => setOverdueTxid(txid), remainingGraceMs);

        return () => clearTimeout(timeout);
    }, [submittedAt, txid]);

    const isMissing = txid !== undefined && txid === overdueTxid && !hasTrackedTransaction;

    const canShowWarning = isMissing && isFocused;

    useEffect(() => {
        if (!canShowWarning || activeAlert || acknowledgedTxidRef.current === txid) return;

        const warning: Alert = {
            type: 'earnTransactionNotConfirmed',
            title: translate('earn.transactionNotConfirmedAlert.title'),
            description: translate('earn.transactionNotConfirmedAlert.description'),
            pictogramVariant: 'warning',
            primaryButtonTitle: translate('generic.buttons.gotIt'),
            onPressPrimaryButton: () => {
                acknowledgedTxidRef.current = txid;
            },
        };
        warningRef.current = warning;
        showAlert(warning);
    }, [activeAlert, canShowWarning, showAlert, translate, txid]);

    useEffect(() => {
        if (!canShowWarning) return undefined;

        return () => {
            if (warningRef.current) hideAlert(warningRef.current);
            warningRef.current = null;
        };
    }, [canShowWarning, hideAlert, txid]);

    return isMissing;
};
