import React from 'react';
import { SettingsLayout } from '@settings-components';
import { Translation } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import { NETWORKS } from '@wallet-config';
import { Network } from '@wallet-types';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import CoinsGroup from './components/CoinsGroup';

const Settings = () => {
    const { changeCoinVisibility, changeNetworks } = useActions({
        changeCoinVisibility: walletSettingsActions.changeCoinVisibility,
        changeNetworks: walletSettingsActions.changeNetworks,
    });
    const { device, enabledNetworks } = useSelector(state => ({
        device: state.suite.device,
        enabledNetworks: state.wallet.settings.enabledNetworks,
    }));

    const unavailableCapabilities = device && device.features ? device.unavailableCapabilities : {};

    const mainnetNetworksFilterFn = (n: Network) => !n.accountType && !n.testnet;

    const testnetNetworksFilterFn = (n: Network) =>
        !n.accountType && 'testnet' in n && n.testnet === true;

    const unavailableNetworksFilterFn = (symbol: Network['symbol']) =>
        !unavailableCapabilities[symbol];

    const enabledMainnetNetworks: Network['symbol'][] = [];
    const enabledTestnetNetworks: Network['symbol'][] = [];

    enabledNetworks.forEach(symbol => {
        const network = NETWORKS.find(n => n.symbol === symbol);
        if (!network) return;
        if (network.testnet) {
            enabledTestnetNetworks.push(network.symbol);
        } else {
            enabledMainnetNetworks.push(network.symbol);
        }
    });

    return (
        <SettingsLayout>
            <CoinsGroup
                label={<Translation id="TR_COINS" />}
                description={<Translation id="TR_COINS_SETTINGS_ALSO_DEFINES" />}
                enabledNetworks={enabledMainnetNetworks}
                filterFn={mainnetNetworksFilterFn}
                onToggleOneFn={changeCoinVisibility}
                onActivateAll={() =>
                    changeNetworks([
                        ...enabledTestnetNetworks.filter(unavailableNetworksFilterFn),
                        ...NETWORKS.filter(mainnetNetworksFilterFn)
                            .map(n => n.symbol)
                            .filter(unavailableNetworksFilterFn),
                    ])
                }
                onDeactivateAll={() => changeNetworks(enabledTestnetNetworks)}
                type="mainnet"
                unavailableCapabilities={unavailableCapabilities}
            />

            <CoinsGroup
                label={<Translation id="TR_TESTNET_COINS" />}
                description={<Translation id="TR_TESTNET_COINS_EXPLAINED" />}
                enabledNetworks={enabledTestnetNetworks}
                filterFn={testnetNetworksFilterFn}
                onToggleOneFn={changeCoinVisibility}
                onActivateAll={() =>
                    changeNetworks([
                        ...enabledMainnetNetworks.filter(unavailableNetworksFilterFn),
                        ...NETWORKS.filter(testnetNetworksFilterFn)
                            .map(n => n.symbol)
                            .filter(unavailableNetworksFilterFn),
                    ])
                }
                onDeactivateAll={() => changeNetworks(enabledMainnetNetworks)}
                type="testnet"
                unavailableCapabilities={unavailableCapabilities}
            />
        </SettingsLayout>
    );
};

export default Settings;
