import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type StakeRootState,
    selectAccountByKey,
    selectUnstakingBalanceByAccountKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

interface TronStakingWithdrawBannerProps {
    accountKey: AccountKey;
}

export const TronStakingWithdrawBanner = ({ accountKey }: TronStakingWithdrawBannerProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const withdrawableBalance =
        useSelector((state: StakeRootState) =>
            selectUnstakingBalanceByAccountKey(state, accountKey),
        ) ?? '0';

    if (account?.networkType !== 'tron') return null;
    if (withdrawableBalance === '0') return null;

    return (
        <BannerInline
            intent="info"
            title={
                <Translation
                    id="earn.tron.readyToWithdrawAlert"
                    values={{ amount: withdrawableBalance }}
                />
            }
        />
    );
};
