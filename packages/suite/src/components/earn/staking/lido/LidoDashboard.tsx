import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { useRefreshStakingProductInfo } from '@suite-common/earn-staking';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';
import { injectDispatch } from '@trezor/redux-utils';

import { StakingFooter } from '#src/views/wallet/staking/components/StakingDashboard/components/StakingFooter';

import { LidoClaimReadyCard } from './LidoClaimReadyCard';
import { LidoDetailsCard } from './LidoDetailsCard';
import { LidoStakedCard } from './LidoStakedCard';
import { LidoTransactions } from './LidoTransactions';
import { LidoWithdrawalCard } from './LidoWithdrawalCard';
import { useLidoStaking } from './useLidoStaking';
import { useLidoWithdrawalRequests } from './useLidoWithdrawalRequests';

type LidoDashboardProps = {
    account: Account;
};

/** The account's Lido staking, laid out as the universal earn detail is. */
export const LidoDashboard = ({ account }: LidoDashboardProps) => {
    const { dispatch } = useServices(injectDispatch);
    const accountKey = account.key;

    useRefreshStakingProductInfo();

    const { wstETHBalance, wstETHValue, withdrawalDays } = useLidoStaking(account);
    const {
        pendingRequests,
        claimableRequests,
        isError: hasWithdrawalsError,
        refetch: refetchWithdrawals,
    } = useLidoWithdrawalRequests(account);
    const isStakeValueMissing = wstETHValue === null && wstETHBalance !== '0';

    useEffect(() => {
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
    }, [accountKey, dispatch]);

    if (getLidoDeployment(account.symbol) === null) {
        return (
            <Banner intent="warning" description={<Translation id="TR_EARN_LIDO_UNAVAILABLE" />} />
        );
    }

    return (
        <Column gap={24} alignItems="stretch" data-testid="@staking/lido-dashboard/container">
            <Column
                gap={16}
                alignItems="stretch"
                width="100%"
                maxWidth={480}
                margin={{ horizontal: 'auto' }}
            >
                {isStakeValueMissing && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_EARN_LIDO_VALUE_UNKNOWN" />}
                    />
                )}

                {/* Shown with the withdrawals of an earlier read, which a failed refresh keeps. */}
                {hasWithdrawalsError && (
                    <Banner
                        intent="warning"
                        data-testid="@staking/lido-dashboard/withdrawals-unknown"
                        description={<Translation id="TR_EARN_LIDO_WITHDRAWALS_UNKNOWN" />}
                        rightContent={
                            <Banner.Button onClick={refetchWithdrawals}>
                                <Translation id="TR_TRY_AGAIN" />
                            </Banner.Button>
                        }
                    />
                )}

                <LidoStakedCard account={account} />

                <LidoClaimReadyCard account={account} claimableRequests={claimableRequests} />

                <LidoWithdrawalCard
                    requests={pendingRequests}
                    symbol={account.symbol}
                    withdrawalDays={withdrawalDays}
                />

                <LidoDetailsCard account={account} />
            </Column>

            <LidoTransactions account={account} />

            <StakingFooter provider="lido" />
        </Column>
    );
};
