import { SettingsLayout } from '@settings-components';
import { ExternalLink, Translation } from '@suite-components';
import { ActionColumn, Row, Section } from '@suite-components/Settings';
import { variables } from '@trezor/components';
import { EXTERNAL_NETWORKS, NETWORKS } from '@wallet-config';
import { Network } from '@wallet-types';
import React from 'react';
import styled from 'styled-components';

import Coin from './components/Coin';
import CoinsGroup from './components/CoinsGroup';
import { Props } from './Container';

const StyledLink = styled(ExternalLink)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

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
            <Section
                title={<Translation id="TR_3RD_PARTY_WALLETS" />}
                description={<Translation id="TR_3RD_PARTY_WALLETS_DESC" />}
            >
                {EXTERNAL_NETWORKS.map(network => (
                    <Row key={network.symbol}>
                        <Coin name={network.name} symbol={network.symbol} />
                        <ActionColumn>
                            <StyledLink variant="nostyle" href={network.url} size="small">
                                {new URL(network.url).hostname}
                            </StyledLink>
                        </ActionColumn>
                    </Row>
                ))}
            </Section>
        </SettingsLayout>
    );
};

export default Settings;
