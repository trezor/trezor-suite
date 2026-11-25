import {
    type StakingDeviceRootState,
    selectDeviceStakingEntriesByWarning,
} from '@suite-common/earn-staking';
import { getNetworkType } from '@suite-common/wallet-config';

// The banner names the ADA rate, so another network's outdated provider does not show it.
export const selectIsCardanoOutdatedStakingBannerShown = (state: StakingDeviceRootState): boolean =>
    selectDeviceStakingEntriesByWarning(state, 'outdated-provider').some(
        ({ descriptor }) => getNetworkType(descriptor.networkSymbol) === 'cardano',
    );
