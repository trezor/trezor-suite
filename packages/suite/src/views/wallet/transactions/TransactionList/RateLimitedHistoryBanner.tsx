import { useState } from 'react';

import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { fetchTransactionsPageThunk } from '@suite-common/wallet-core';
import { isDirectRpcHistoryRateLimited } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';

import { type Account } from 'src/types/wallet';

interface RateLimitedHistoryBannerProps {
    account: Account;
}

/**
 * A direct-RPC backend skips what the provider's rate limit would not let it read rather than fail
 * the whole request, so without this the list would just come up short.
 */
export const RateLimitedHistoryBanner = ({ account }: RateLimitedHistoryBannerProps) => {
    const { dispatch } = useServices(injectDispatch);
    const [isRetrying, setIsRetrying] = useState(false);

    if (!isDirectRpcHistoryRateLimited(account)) return null;

    const handleRetry = async () => {
        setIsRetrying(true);
        try {
            await dispatch(
                fetchTransactionsPageThunk({
                    accountKey: account.key,
                    page: 1,
                    perPage: getTxsPerPage(account.networkType),
                    forceRefetch: true,
                    noLoading: true,
                }),
            );
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <Banner
            intent="warning"
            icon
            title={<Translation id="TR_HISTORY_RATE_LIMITED_TITLE" />}
            description={<Translation id="TR_HISTORY_RATE_LIMITED_DESCRIPTION" />}
            rightContent={
                <Banner.Button
                    onClick={handleRetry}
                    isLoading={isRetrying}
                    data-testid="@wallet/accounts/rate-limited-history-retry"
                >
                    <Translation id="TR_TRY_AGAIN" />
                </Banner.Button>
            }
        />
    );
};
