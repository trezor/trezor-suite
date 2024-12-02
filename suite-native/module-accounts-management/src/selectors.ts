import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
    FeatureFlag,
} from '@suite-native/feature-flags';

export const selectIsNetworkSendFlowEnabled = (
    state: FeatureFlagsRootState,
    symbol?: NetworkSymbol,
) => {
    if (!symbol) return false;
    const networkType = getNetworkType(symbol);

    const isCardanoSendEnabled = selectIsFeatureFlagEnabled(
        state,
        FeatureFlag.IsCardanoSendEnabled,
    );

    if (networkType !== 'cardano' || isCardanoSendEnabled) return true;

    return false;
};
