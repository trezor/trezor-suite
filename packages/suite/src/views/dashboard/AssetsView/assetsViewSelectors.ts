import {
    type StakingDeviceRootState,
    formatStakingAmount,
    selectDeviceActiveStakingPositionEntriesBySymbol,
} from '@suite-common/earn-staking';
import { getStakingPositionAmount, stakingAmountSchema } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';

// The staking row shows what the network holds outside its balance: a liquid delegation, as on
// Cardano, is the balance itself and stays out, as the row always left it.
export const selectDashboardAssetStakingAmount = (
    state: StakingDeviceRootState,
    networkSymbol: NetworkSymbol,
): string => {
    const amount = selectDeviceActiveStakingPositionEntriesBySymbol(state, networkSymbol)
        .filter(({ position }) => position.lockup === 'locked')
        .reduce(
            (sum, { position }) => sum.plus(getStakingPositionAmount(position)),
            new BigNumber(0),
        );

    return formatStakingAmount({
        amount: stakingAmountSchema.parse(amount.toFixed(0)),
        networkSymbol,
    });
};
