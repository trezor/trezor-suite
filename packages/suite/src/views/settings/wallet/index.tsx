import React from 'react';
import { SettingsLayout } from '@settings-components';
import { Translation } from '@suite-components';
import { NETWORKS } from '@wallet-config';
import { Network } from '@wallet-types';
import CoinsGroup from './components/CoinsGroup';
import { Props } from './Container';

const Settings = (props: Props) => {
    const { enabledNetworks } = props.wallet.settings;
    const unavailableCapabilities =
        props.device && props.device.features ? props.device.unavailableCapabilities : {};

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
                onToggleOneFn={props.changeCoinVisibility}
                onActivateAll={() =>
                    props.changeNetworks([
                        ...enabledTestnetNetworks.filter(unavailableNetworksFilterFn),
                        ...NETWORKS.filter(mainnetNetworksFilterFn)
                            .map(n => n.symbol)
                            .filter(unavailableNetworksFilterFn),
                    ])
                }
                onDeactivateAll={() => props.changeNetworks(enabledTestnetNetworks)}
                type="mainnet"
                unavailableCapabilities={unavailableCapabilities}
            />

            <CoinsGroup
                label={<Translation id="TR_TESTNET_COINS" />}
                description={<Translation id="TR_TESTNET_COINS_EXPLAINED" />}
                enabledNetworks={enabledTestnetNetworks}
                filterFn={testnetNetworksFilterFn}
                onToggleOneFn={props.changeCoinVisibility}
                onActivateAll={() =>
                    props.changeNetworks([
                        ...enabledMainnetNetworks.filter(unavailableNetworksFilterFn),
                        ...NETWORKS.filter(testnetNetworksFilterFn)
                            .map(n => n.symbol)
                            .filter(unavailableNetworksFilterFn),
                    ])
                }
                onDeactivateAll={() => props.changeNetworks(enabledMainnetNetworks)}
                type="testnet"
                unavailableCapabilities={unavailableCapabilities}
            />
        </SettingsLayout>
    );
};

export default Settings;
