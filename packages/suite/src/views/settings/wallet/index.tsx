import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { P, Switch, Link, Icon, variables, colors, CoinLogo } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SuiteLayout } from '@suite-components';
import { Menu as SettingsMenu } from '@settings-components';
import { AppState, Dispatch } from '@suite-types';
import { NETWORKS, EXTERNAL_NETWORKS } from '@wallet-config';
import { Network, ExternalNetwork } from '@wallet-types';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import { SectionHeader, Section, ActionColumn, Row } from '@suite-components/Settings';

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeCoinVisibility: bindActionCreators(walletSettingsActions.changeCoinVisibility, dispatch),
    toggleGroupCoinsVisibility: bindActionCreators(
        walletSettingsActions.toggleGroupCoinsVisibility,
        dispatch,
    ),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

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

const ToggleAll = styled.div`
    cursor: pointer;
    min-width: 100px;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK0};
    text-align: right;
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

const StyledLink = styled(Link)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

type FilterFn = (n: Network) => boolean;
interface CoinsGroupProps {
    label: React.ReactNode;
    description?: React.ReactNode;
    onToggleAllFn: (filterFn: FilterFn) => void;
    onToggleOneFn: (symbol: Network['symbol'], visible: boolean) => void;
    filterFn: FilterFn;
    enabledNetworks: Network['symbol'][];
    type: 'mainnet' | 'testnet'; // used in tests
}

const CoinsGroup = ({
    label,
    description,
    onToggleAllFn,
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
            <ToggleAll
                onClick={() => onToggleAllFn(filterFn)}
                data-test={`@settings/wallet/coins-group/${props.type}/toggle-all`}
            >
                {NETWORKS.filter(filterFn).some(n => enabledNetworks.includes(n.symbol)) ? (
                    <Translation {...messages.TR_DEACTIVATE_ALL} />
                ) : (
                    <Translation {...messages.TR_ACTIVATE_ALL} />
                )}
            </ToggleAll>
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

const Settings = (props: Props) => {
    const { enabledNetworks } = props.wallet.settings;

    const baseNetworksFilterFn = (n: Network) => {
        return !n.accountType && !n.testnet;
    };

    const testnetNetworksFilterFn = (n: Network) => {
        return !n.accountType && 'testnet' in n && n.testnet === true;
    };

    return (
        <SuiteLayout title="Settings" secondaryMenu={<SettingsMenu />}>
            {/* todo: imho base padding should be in SuiteLayout, but it would break WalletLayout, so I have it temporarily here */}
            <div
                style={{
                    padding: '30px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <P size="tiny">
                    <Translation {...messages.TR_COINS_SETTINGS_ALSO_DEFINES} />
                </P>

                <CoinsGroup
                    label={<Translation>{messages.TR_COINS}</Translation>}
                    enabledNetworks={enabledNetworks}
                    filterFn={baseNetworksFilterFn}
                    onToggleOneFn={props.changeCoinVisibility}
                    onToggleAllFn={props.toggleGroupCoinsVisibility}
                    type="mainnet"
                />

                <CoinsGroup
                    label={<Translation>{messages.TR_TESTNET_COINS}</Translation>}
                    description={<Translation>{messages.TR_TESTNET_COINS_EXPLAINED}</Translation>}
                    enabledNetworks={enabledNetworks}
                    filterFn={testnetNetworksFilterFn}
                    onToggleOneFn={props.changeCoinVisibility}
                    onToggleAllFn={props.toggleGroupCoinsVisibility}
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
                                <StyledLink variant="nostyle" href={n.url}>
                                    <Translation>{n.url.replace('https://', '')}</Translation>
                                </StyledLink>
                            </ActionColumn>
                        </Row>
                    ))}
                </Section>
            </div>
        </SuiteLayout>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
