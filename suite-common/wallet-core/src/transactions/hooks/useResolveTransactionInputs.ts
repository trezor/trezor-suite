import { useEffect, useState } from 'react';

import {
    type AccountKey,
    type WalletAccountTransaction,
    createAccountKey,
} from '@suite-common/wallet-types';
import { hasUnresolvedInputs } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { resolveTransactionInputsThunk } from '../transactionsThunks';

type ResolvableTransaction = Pick<
    WalletAccountTransaction,
    'txid' | 'descriptor' | 'symbol' | 'deviceState' | 'details'
>;

type ResolveRequest = {
    accountKey: AccountKey;
    txid: string;
};

export type TransactionInputsResolution = {
    // Some of the transactions miss input values which are being fetched.
    isResolving: boolean;
    // The missing input values of some of the transactions could not be fetched.
    hasFailed: boolean;
};

const getResolveRequest = ({
    descriptor,
    symbol,
    deviceState,
    txid,
}: ResolvableTransaction): ResolveRequest => ({
    accountKey: createAccountKey({
        accountDescriptor: descriptor,
        networkSymbol: symbol,
        deviceStaticSessionId: deviceState,
    }),
    txid,
});

const getRequestId = ({ accountKey, txid }: ResolveRequest) => `${accountKey}/${txid}`;

/**
 * Fetches the input values which the backend left out of the given transactions (see
 * `hasUnresolvedInputs`), e.g. for the fee of an incoming transaction. It is meant for the detail
 * of a transaction, as each transaction costs requests of all its previous transactions.
 */
export const useResolveTransactionInputs = (
    transactions: readonly ResolvableTransaction[],
): TransactionInputsResolution => {
    const { dispatch } = useServices(injectDispatch);

    const [failedRequestIds, setFailedRequestIds] = useState<readonly string[]>([]);

    const unresolvedRequests = transactions.filter(hasUnresolvedInputs).map(getResolveRequest);
    // A string, so that the effect runs again only when other transactions miss input values and
    // not whenever a caller passes a new array.
    const unresolvedRequestsJson = JSON.stringify(unresolvedRequests);

    useEffect(() => {
        const requests: ResolveRequest[] = JSON.parse(unresolvedRequestsJson);
        let isCurrent = true;

        requests.forEach(request => {
            void dispatch(resolveTransactionInputsThunk(request))
                .unwrap()
                .catch(() => false)
                .then(isResolved => {
                    if (isResolved || !isCurrent) return;

                    const requestId = getRequestId(request);
                    setFailedRequestIds(ids =>
                        ids.includes(requestId) ? ids : [...ids, requestId],
                    );
                });
        });

        return () => {
            isCurrent = false;
        };
    }, [unresolvedRequestsJson, dispatch]);

    const hasRequestFailed = (request: ResolveRequest) =>
        failedRequestIds.includes(getRequestId(request));

    return {
        isResolving: unresolvedRequests.some(request => !hasRequestFailed(request)),
        hasFailed: unresolvedRequests.some(hasRequestFailed),
    };
};
