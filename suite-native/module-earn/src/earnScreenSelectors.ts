import { getStakingPromoListSymbols } from '@suite-common/wallet-core';
import { type SettingsSliceRootState, selectAreTestnetsEnabled } from '@suite-native/settings';

export const selectStakingPromoListSymbols = (state: SettingsSliceRootState) =>
    getStakingPromoListSymbols(selectAreTestnetsEnabled(state));
