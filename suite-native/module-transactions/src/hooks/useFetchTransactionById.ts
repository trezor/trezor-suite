import { useCallback, useRef, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { fetchTransactionByIdThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

type UseFetchTransactionByIdParams = {
    accountKey: AccountKey;
    txid: string;
    isEnabled: boolean;
};

type ActiveRequest = {
    abort: () => void;
    requestId: string;
};

export const useFetchTransactionById = ({
    accountKey,
    txid,
    isEnabled,
}: UseFetchTransactionByIdParams) => {
    const { dispatch } = useServices(injectDispatch);
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const activeRequestRef = useRef<ActiveRequest | null>(null);

    const fetchTransaction = useCallback(() => {
        activeRequestRef.current?.abort();
        setStatus('loading');

        const request = dispatch(fetchTransactionByIdThunk({ accountKey, txid }));
        const activeRequest = {
            abort: () => request.abort(),
            requestId: request.requestId,
        };
        activeRequestRef.current = activeRequest;

        void request
            .unwrap()
            .catch(() => {
                if (activeRequestRef.current?.requestId === activeRequest.requestId) {
                    setStatus('error');
                }
            })
            .finally(() => {
                if (activeRequestRef.current?.requestId === activeRequest.requestId) {
                    activeRequestRef.current = null;
                }
            });
    }, [accountKey, dispatch, txid]);

    useFocusEffect(
        useCallback(() => {
            if (!isEnabled) return;

            fetchTransaction();

            return () => {
                activeRequestRef.current?.abort();
                activeRequestRef.current = null;
            };
        }, [fetchTransaction, isEnabled]),
    );

    return {
        isError: status === 'error',
        isFetching: status === 'loading',
        retry: fetchTransaction,
    };
};
