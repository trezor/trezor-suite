import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { fetchTransactionsPageThunk } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { type Account } from 'src/types/wallet';

interface LoadOlderHistoryProps {
    account: Account;
    /** How many transactions the list already holds, including not-yet-filled page slots. */
    loadedCount: number;
}

/**
 * A direct-RPC backend cannot enumerate an address's whole history, so it scans a window of blocks
 * and reports where that window ends. Everything older stays unreachable until someone asks for it,
 * which is what this does - one step further back per press.
 */
export const LoadOlderHistory = ({ account, loadedCount }: LoadOlderHistoryProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [isLoading, setIsLoading] = useState(false);

    const from = account.networkType === 'ethereum' ? account.misc.olderHistoryFrom : undefined;

    if (account.backendType !== 'evm-rpc' || from === undefined) return null;

    const handleClick = async () => {
        const perPage = getTxsPerPage(account.networkType);
        setIsLoading(true);
        try {
            // `from` widens the backend's window and the page is served from the widened history in
            // the same request, so this asks for the page that starts where the list currently
            // ends. `noLoading` keeps the transactions already on screen: the button carries the
            // progress instead of the list blanking into skeletons.
            await dispatch(
                fetchTransactionsPageThunk({
                    accountKey: account.key,
                    page: Math.floor(loadedCount / perPage) + 1,
                    perPage,
                    forceRefetch: true,
                    noLoading: true,
                    from,
                }),
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            intent="neutral"
            priority="secondary"
            isLoading={isLoading}
            onClick={handleClick}
            data-testid="@wallet/accounts/load-older-history"
        >
            <Translation id="TR_LOAD_OLDER_TRANSACTIONS" />
        </Button>
    );
};
