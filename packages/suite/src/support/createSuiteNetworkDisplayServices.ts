import type { NetworksRootState } from '@suite-common/networks/reduxState/networksReducer';
import { selectNetworkNamesMap } from '@suite-common/networks/reduxState/networksSelectors';
import { createWeakMapSelector } from '@suite-common/redux-utils/src/selectorsUtils';
import {
    type WalletSettingsRootState,
    selectEnabledNetworks,
} from '@suite-common/wallet-core/src/settings/walletSettingsReducer';
import type {
    NetworkDisplayServices,
    NetworkDisplayServicesDep,
    NetworkOption,
    Readable,
} from '@trezor/product-components/network-display/services';

export type SuiteNetworkDisplayServicesDeps = {
    getState: () => NetworksRootState & WalletSettingsRootState;
    subscribe: Readable<readonly NetworkOption[]>['subscribe'];
};

export const createSuiteNetworkDisplayServices = (
    deps: SuiteNetworkDisplayServicesDeps,
): NetworkDisplayServices => ({
    getNetworks: symbols => {
        const selectOptions = createWeakMapSelector(
            [
                (state: NetworksRootState & WalletSettingsRootState) =>
                    symbols ?? selectEnabledNetworks(state),
                selectNetworkNamesMap,
            ],
            (networks, names): readonly NetworkOption[] =>
                networks.map(symbol => ({ symbol, name: names?.[symbol] ?? symbol })),
        );

        return {
            getSnapshot: () => selectOptions(deps.getState()),
            subscribe: deps.subscribe,
        };
    },
});

export const injectNetworkDisplayServices = (services: any): NetworkDisplayServicesDep => ({
    networkDisplayServices: services.networkDisplayServices,
});
