import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { P, Switch, Icon, variables, colors, CoinLogo, Button } from '@trezor/components';
import { Translation, ExternalLink } from '@suite-components';
import messages from '@suite/support/messages';
import { SettingsLayout } from '@settings-components';
import { AppState, Dispatch } from '@suite-types';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { Network, ExternalNetwork } from '@wallet-types';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { SectionHeader, Section, ActionColumn, Row } from '@suite-components/Settings';

const Header = styled.div`
    display: flex;
    min-height: 20px;
    justify-content: space-between;
    padding-right: 4%;
    margin-top: 20px;
`;

const CoinsGroupWrapper = styled.div``;

const HeaderLeft = styled.div`
    padding-right: 4%;
`;

const ToggleButtons = styled.div`
    display: flex;
`;

const CoinWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const CoinName = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.BLACK0};
    margin: 0 8px;
    padding-top: 2px;
`;

const CoinSymbol = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    padding-top: 2px;
`;

const Coin = ({ network }: { network: Network | ExternalNetwork }) => (
    <CoinWrapper>
        <CoinLogo size={24} symbol={network.symbol} />
        <CoinName> {network.name}</CoinName>
        <CoinSymbol> {network.symbol.toUpperCase()}</CoinSymbol>
    </CoinWrapper>
);

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
}

const CoinsGroup = ({
    label,
    description,
    onActivateAll,
    onDeactivateAll,
    onToggleOneFn,
    filterFn,
    enabledNetworks,
    ...props
}: CoinsGroupProps) => (
    <CoinsGroupWrapper data-test="@settings/wallet/coins-group">
        <Header>
            <HeaderLeft>
                <SectionHeader>{label}</SectionHeader>
                {description && <P size="tiny">{description}</P>}
            </HeaderLeft>
            <ToggleButtons>
                <Button
                    isDisabled={NETWORKS.filter(filterFn).length === enabledNetworks.length}
                    variant="tertiary"
                    size="small"
                    icon="CHECK"
                    onClick={() => onActivateAll()}
                    data-test={`@settings/wallet/coins-group/${props.type}/activate-all`}
                >
                    <Translation {...messages.TR_ACTIVATE_ALL} />
                </Button>
                <Button
                    isDisabled={enabledNetworks.length === 0}
                    variant="tertiary"
                    size="small"
                    icon="CROSS"
                    onClick={() => onDeactivateAll()}
                    data-test={`@settings/wallet/coins-group/${props.type}/deactivate-all`}
                >
                    <Translation {...messages.TR_DEACTIVATE_ALL} />
                </Button>
            </ToggleButtons>
        </Header>

        <Section>
            {NETWORKS.filter(filterFn).map(n => (
                <CoinRow key={n.symbol}>
                    <Coin network={n} />
                    <ActionColumn>
                        <AdvancedSettings>
                            <SettingsIcon icon="SETTINGS" size={12} color={colors.BLACK25} />
                            <Translation {...messages.TR_ADVANCED_SETTINGS} />
                        </AdvancedSettings>
                        <Switch
                            onChange={(visible: boolean) => {
                                onToggleOneFn(n.symbol, visible);
                            }}
                            checked={enabledNetworks.includes(n.symbol)}
                        />
                    </ActionColumn>
                </CoinRow>
            ))}
        </Section>
    </CoinsGroupWrapper>
);

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeCoinVisibility: bindActionCreators(walletSettingsActions.changeCoinVisibility, dispatch),
    changeNetworks: bindActionCreators(walletSettingsActions.changeNetworks, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Settings = (props: Props) => {
    const { enabledNetworks } = props.wallet.settings;

    const mainnetNetworksFilterFn = (n: Network) => {
        return !n.accountType && !n.testnet;
    };

    const testnetNetworksFilterFn = (n: Network) => {
        return !n.accountType && 'testnet' in n && n.testnet === true;
    };

    const enabledMainnetNetworks: Network['symbol'][] = [];
    const enabledTestnetNetworks: Network['symbol'][] = [];
    enabledNetworks.forEach(en => {
        const network = NETWORKS.find(n => n.symbol === en);
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
                <Translation {...messages.TR_COINS_SETTINGS_ALSO_DEFINES} />
            </P>

            <CoinsGroup
                label={<Translation>{messages.TR_COINS}</Translation>}
                enabledNetworks={enabledMainnetNetworks}
                filterFn={mainnetNetworksFilterFn}
                onToggleOneFn={props.changeCoinVisibility}
                onActivateAll={() =>
                    props.changeNetworks([
                        ...enabledTestnetNetworks,
                        ...NETWORKS.filter(mainnetNetworksFilterFn).map(n => n.symbol),
                    ])
                }
                onDeactivateAll={() => props.changeNetworks(enabledTestnetNetworks)}
                type="mainnet"
            />

            <CoinsGroup
                label={<Translation>{messages.TR_TESTNET_COINS}</Translation>}
                description={<Translation>{messages.TR_TESTNET_COINS_EXPLAINED}</Translation>}
                enabledNetworks={enabledTestnetNetworks}
                filterFn={testnetNetworksFilterFn}
                onToggleOneFn={props.changeCoinVisibility}
                onActivateAll={() =>
                    props.changeNetworks([
                        ...enabledMainnetNetworks,
                        ...NETWORKS.filter(testnetNetworksFilterFn).map(n => n.symbol),
                    ])
                }
                onDeactivateAll={() => props.changeNetworks(enabledMainnetNetworks)}
                type="testnet"
            />

            <SectionHeader>
                <Translation>{messages.TR_3RD_PARTY_WALLETS}</Translation>
                <P size="tiny">
                    <Translation>{messages.TR_3RD_PARTY_WALLETS_DESC}</Translation>
                </P>
            </SectionHeader>
            <Section>
                {EXTERNAL_NETWORKS.map(n => (
                    <Row key={n.symbol}>
                        <Coin network={n} />
                        <ActionColumn>
                            <StyledLink variant="nostyle" href={n.url} size="small">
                                <Translation>{new URL(n.url).hostname}</Translation>
                            </StyledLink>
                        </ActionColumn>
                    </Row>
                ))}
            </Section>
        </SettingsLayout>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
