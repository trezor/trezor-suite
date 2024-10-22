import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    FeatureFlagsRootState,
    selectIsFeatureFlagEnabled,
    FeatureFlag,
} from '@suite-native/feature-flags';

const SEND_COINS_WHITELIST: NetworkSymbol[] = ['btc', 'test', 'regtest'];

export const selectIsNetworkSendFlowEnabled = (
    state: FeatureFlagsRootState,
    networkSymbol?: NetworkSymbol,
) => {
    if (!networkSymbol) return false;

    if (SEND_COINS_WHITELIST.includes(networkSymbol)) return true;

    const isBitcoinLikeSendEnabled = selectIsFeatureFlagEnabled(
        state,
        FeatureFlag.IsBitcoinLikeSendEnabled,
    );

    const networkType = getNetworkType(networkSymbol);
    if (isBitcoinLikeSendEnabled && networkType === 'bitcoin') return true;

    const isEthereumSendEnabled = selectIsFeatureFlagEnabled(
        state,
        FeatureFlag.IsEthereumSendEnabled,
    );

    if (isEthereumSendEnabled && ['eth', 'etc', 'tsep', 'thol'].includes(networkSymbol))
        return true;

    return false;
};
