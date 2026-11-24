import { useSelector } from 'react-redux';

import { createAssetId } from '@suite-common/assets';
import {
    type StakingRootState,
    formatStakingAmount,
    selectStakingAccountPositionEntry,
} from '@suite-common/earn-staking';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { AssetSymbol } from '@suite-native/assets';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { settleTronUnlocks } from '../../utils/staking/settleTronUnlocks';

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
                        displaySymbol: (
                            <AssetSymbol
                                assetId={createAssetId({ networkSymbol })}
                                variant="body-sm"
                                color="contentInfo"
                            />
                        ),
                    }}
                />
            }
        />
    );
};
