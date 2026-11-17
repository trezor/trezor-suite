import { useSelector } from 'react-redux';

import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountPositionEntry,
} from '@suite-common/earn-staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNow } from '@trezor/react-utils';

import {
    TRON_UNLOCKS_REFRESH_INTERVAL_MS,
    settleTronUnlocks,
} from '../../utils/staking/settleTronUnlocks';

type TronStakingWithdrawBannerProps = {
    accountKey: AccountKey;
};

export const TronStakingWithdrawBanner = ({ accountKey }: TronStakingWithdrawBannerProps) => {
    const positionEntry = useSelector((state: StakingRootState) =>
        selectStakingAccountPositionEntry(state, accountKey),
    );
    const nowMs = useNow(TRON_UNLOCKS_REFRESH_INTERVAL_MS);

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
