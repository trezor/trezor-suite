import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { networksCollection } from '@suite-common/wallet-config';
import { type WalletSettingsRootState, selectEnabledNetworks } from '@suite-common/wallet-core';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    WalletSettingsRootState & MessageSystemRootState
>();

export const selectIsMevProtectionFeatureEnabled = (state: MessageSystemRootState) =>
    selectIsFeatureEnabled(state, Feature.mevProtection, true);

const MEV_PROTECTION_SUPPORTED_NETWORK_SYMBOLS = networksCollection
    .filter(network => network.features.includes('mev-protection'))
    .map(network => network.symbol);

export const selectIsMevProtectionSettingsVisible = createMemoizedSelector(
    [selectIsMevProtectionFeatureEnabled, selectEnabledNetworks],
    (isFeatureEnabled, enabledNetworks) =>
        isFeatureEnabled &&
        enabledNetworks.some(enabledNetwork =>
            MEV_PROTECTION_SUPPORTED_NETWORK_SYMBOLS.includes(enabledNetwork),
        ),
);
