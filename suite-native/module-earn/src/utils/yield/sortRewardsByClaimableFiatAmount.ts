import { type StablecoinYieldAccountRewards } from '@suite-common/wallet-core';
import { BigNumber } from '@trezor/utils';

type Reward = StablecoinYieldAccountRewards['rewards'][number];

export const sortRewardsByClaimableFiatAmount = (a: Reward, b: Reward) => {
    const aFiatAmount = new BigNumber(a.fiat.claimable ?? '0');
    const bFiatAmount = new BigNumber(b.fiat.claimable ?? '0');

    return bFiatAmount.minus(aFiatAmount).toNumber();
};
