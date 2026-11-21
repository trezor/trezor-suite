import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountPositionEntry,
    settleTronUnlocks,
} from '@suite-common/earn-staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type TronStakingWithdrawBannerProps = {
    accountKey: AccountKey;
    nowMs: number;
};

export const TronStakingWithdrawBanner = ({
    accountKey,
    nowMs,
}: TronStakingWithdrawBannerProps) => {
    const positionEntry = useSelector((state: StakingRootState) =>
        selectStakingAccountPositionEntry(state, accountKey),
    );

    if (positionEntry === null) return null;

    const { networkSymbol } = positionEntry.descriptor;
    const { withdrawable } = settleTronUnlocks({ position: positionEntry.position, nowMs });

    const withdrawableBalance = formatStakingAmount({ amount: withdrawable, networkSymbol });

    if (!isPositiveBalance(withdrawableBalance)) return null;

    return (
        <BannerInline
            intent="info"
            title={
                <Translation
                    id="earn.tron.readyToWithdrawAlert"
                    values={{
                        amount: withdrawableBalance,
                        displaySymbol: getNetworkDisplaySymbol(networkSymbol),
                    }}
                />
            }
        />
    );
};
