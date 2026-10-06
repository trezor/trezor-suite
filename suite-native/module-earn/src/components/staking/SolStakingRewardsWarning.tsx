import { useSelector } from 'react-redux';

import { useSolStakingRewardsWarning } from '@suite-common/earn-staking-api';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountIsStakingActive,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { BannerFull } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type SolStakingRewardsWarningProps = {
    accountKey: AccountKey;
};

type SolStakingRewardsWarningContentProps = {
    account: Account;
};

const SolStakingRewardsWarningContent = ({ account }: SolStakingRewardsWarningContentProps) => {
    const { shouldShowWarning } = useSolStakingRewardsWarning(account);

    if (!shouldShowWarning) return null;

    return (
        <BannerFull
            testID="@staking/sol-rewards-warning"
            intent="warning"
            title={<Translation id="earn.stakingManagementScreen.solRewardsWarning" />}
        />
    );
};

export const SolStakingRewardsWarning = ({ accountKey }: SolStakingRewardsWarningProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isStakingActive = useSelector((state: TransactionsRootState & AccountsRootState) =>
        selectAccountIsStakingActive(state, accountKey),
    );

    if (!account || !isStakingActive) return null;

    return <SolStakingRewardsWarningContent account={account} />;
};
