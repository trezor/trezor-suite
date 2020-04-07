import React from 'react';
import styled from 'styled-components';
import { P, Switch, Icon, variables, colors, Button } from '@trezor/components';
import { Translation, ExternalLink } from '@suite-components';
import { SettingsLayout } from '@settings-components';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { UnavailableCapability } from 'trezor-connect';
import { Network } from '@wallet-types';
import { SectionHeader, Section, ActionColumn, Row } from '@suite-components/Settings';
import { useDeviceActionLocks } from '@suite-utils/hooks';
import Coin from './components/Coin';
import { Props } from './Container';

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid lime;
`;

const CoinsGroupWrapper = styled.div``;

const HeaderLeft = styled.div`
    border: 1px solid red;
`;

const ToggleButtons = styled.div`
    display: flex;
`;

const AdvancedSettings = styled.div`
    display: flex;
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
    /* todo: not in variables but is in design */
    font-weight: 500;
    margin-right: 4%;
    min-width: 120px;
    visibility: hidden;
`;

const UnavailableLabel = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK25};
    white-space: nowrap;
`;

const SettingsIcon = styled(Icon)`
    position: relative;
    top: 2px;
    right: 4px;
`;

const CoinRow = styled(Row)`
    &:hover ${AdvancedSettings} {
        visibility: visible;
    }
`;

const StyledLink = styled(ExternalLink)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

type FilterFn = (n: Network) => boolean;
interface CoinsGroupProps {
    label: React.ReactNode;
    description?: React.ReactNode;
    onActivateAll: () => void;
    onDeactivateAll: () => void;
    onToggleOneFn: (symbol: Network['symbol'], visible: boolean) => void;
    filterFn: FilterFn;
    enabledNetworks: Network['symbol'][];
    type: 'mainnet' | 'testnet'; // used in tests
    unavailableCapabilities: { [key: string]: UnavailableCapability };
}

const Unavailable = ({ type }: { type: UnavailableCapability }) => {
    switch (type) {
        case 'no-capability':
            return <Translation id="FW_CAPABILITY_NO_CAPABILITY" />;
        case 'no-support':
            return <Translation id="FW_CAPABILITY_NO_SUPPORT" />;
        case 'update-required':
            return <Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />;
        // case 'trezor-connect-outdated':
        default:
            return <Translation id="FW_CAPABILITY_CONNECT_OUTDATED" />;
    }
};

const CoinsGroup = ({
    label,
    description,
    onActivateAll,
    onDeactivateAll,
    onToggleOneFn,
    filterFn,
    enabledNetworks,
    unavailableCapabilities,
    ...props
}: CoinsGroupProps) => {
    const [actionEnabled] = useDeviceActionLocks();
    return (
        <CoinsGroupWrapper data-test="@settings/wallet/coins-group">
            <Header>
                <HeaderLeft>
                    <SectionHeader>{label}</SectionHeader>
                    {description && <P size="tiny">{description}</P>}
                </HeaderLeft>
                <ToggleButtons>
                    <Button
                        isDisabled={
                            !actionEnabled ||
                            NETWORKS.filter(filterFn).length === enabledNetworks.length
                        }
                        variant="tertiary"
                        size="small"
                        icon="CHECK"
                        onClick={() => onActivateAll()}
                        data-test={`@settings/wallet/coins-group/${props.type}/activate-all`}
                    >
                        <Translation id="TR_ACTIVATE_ALL" />
                    </Button>
                    <Button
                        isDisabled={!actionEnabled || enabledNetworks.length === 0}
                        variant="tertiary"
                        size="small"
                        icon="CROSS"
                        onClick={() => onDeactivateAll()}
                        data-test={`@settings/wallet/coins-group/${props.type}/deactivate-all`}
                    >
                        <Translation id="TR_DEACTIVATE_ALL" />
                    </Button>
                </ToggleButtons>
            </Header>

            <Section>
                {NETWORKS.filter(filterFn).map(network => (
                    <CoinRow key={network.symbol}>
                        <Coin symbol={network.symbol} name={network.name} />
                        <ActionColumn>
                            {/* hidden with display 'none' until implemented */}
                            <AdvancedSettings style={{ display: 'none' }}>
                                <SettingsIcon icon="SETTINGS" size={12} color={colors.BLACK25} />
                                <Translation id="TR_ADVANCED_SETTINGS" />
                            </AdvancedSettings>
                            {!unavailableCapabilities[network.symbol] && (
                                <Switch
                                    data-test={`@settings/wallet/network/${network.symbol}`}
                                    onChange={(visible: boolean) => {
                                        onToggleOneFn(network.symbol, visible);
                                    }}
                                    checked={enabledNetworks.includes(network.symbol)}
                                    disabled={!actionEnabled}
                                />
                            )}
                            {unavailableCapabilities[network.symbol] && (
                                <UnavailableLabel>
                                    <Unavailable type={unavailableCapabilities[network.symbol]} />
                                </UnavailableLabel>
                            )}
                        </ActionColumn>
                    </CoinRow>
                ))}
            </Section>
        </CoinsGroupWrapper>
    );
};

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
            <P size="tiny">
                <Translation id="TR_COINS_SETTINGS_ALSO_DEFINES" />
            </P>

            <CoinsGroup
                label={<Translation id="TR_COINS" />}
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

            <SectionHeader>
                <Translation id="TR_3RD_PARTY_WALLETS" />
                <P size="tiny">
                    <Translation id="TR_3RD_PARTY_WALLETS_DESC" />
                </P>
            </SectionHeader>
            <Section>
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
// authorization

export default Settings;
