import {
    type StakingPromoRootState,
    selectStakingPromoProductDescriptors,
} from '@suite-common/earn-staking';
import { type StakingProductDescriptor } from '@suite-common/earn-staking-common';
import { type SettingsSliceRootState, selectAreTestnetsEnabled } from '@suite-native/settings';

export const selectStakingPromoListDescriptors = (
    state: StakingPromoRootState & SettingsSliceRootState,
): readonly StakingProductDescriptor[] =>
    selectStakingPromoProductDescriptors(state, selectAreTestnetsEnabled(state));
