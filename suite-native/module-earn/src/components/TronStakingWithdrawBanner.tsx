import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    selectUnstakingBalanceByAccountKey,
    useSelector as useStakingSelector,
} from '@suite-native/staking';

interface TronStakingWithdrawBannerProps {
    accountKey: AccountKey;
}

export const TronStakingWithdrawBanner = ({ accountKey }: TronStakingWithdrawBannerProps) => {
    const account = useStakingSelector(state => selectAccountByKey(state, accountKey));

    const withdrawableBalance =
        useStakingSelector(state => selectUnstakingBalanceByAccountKey(state, accountKey)) ?? '0';

    if (account?.networkType !== 'tron') return null;
    if (withdrawableBalance === '0') return null;

    return (
        <InlineAlertBox
            variant="info"
            title={
                <Translation
                    id="earn.tron.readyToWithdrawAlert"
                    values={{ amount: withdrawableBalance }}
                />
            }
        />
    );
};
