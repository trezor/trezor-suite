import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { H2, P, Switch, variables, colors } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { SuiteLayout, SettingsMenu } from '@suite-components';
import { AppState, Dispatch } from '@suite-types';
import networks from '@suite/config/wallet/networks';
import { Network } from '@wallet-types';
import { CoinLogo } from '@trezor/components';
import * as settingsActions from '@wallet-actions/settingsActions';
import { SectionHeader, Section, ActionColumn, Row } from '@suite-components/Settings';

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    changeCoinVisibility: bindActionCreators(settingsActions.changeCoinVisibility, dispatch),
    toggleGroupCoinsVisibility: bindActionCreators(
        settingsActions.toggleGroupCoinsVisibility,
        dispatch,
    ),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Header = styled.div`
    display: flex;
    min-height: 20px;
    justify-content: space-between;
    padding-left: 4%;
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

const Coin = styled.div`
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

type FilterFn = (n: Network) => boolean;
interface CoinsGroupProps {
    label: React.ReactNode;
    description?: React.ReactNode;
    onToggleAllFn: (filterFn: FilterFn) => void;
    onToggleOneFn: (symbol: Network['symbol'], visible: boolean) => void;
    filterFn: FilterFn;
    enabledNetworks: Network['symbol'][];
}

const CoinsGroup = ({
    label,
    description,
    onToggleAllFn,
    onToggleOneFn,
    filterFn,
    enabledNetworks,
}: CoinsGroupProps) => (
    <CoinsGroupWrapper>
        <Header>
            <HeaderLeft>
                <SectionHeader>{label}</SectionHeader>
                {description && <P size="tiny">{description}</P>}
            </HeaderLeft>
            <ToggleAll onClick={() => onToggleAllFn(filterFn)}>
                {networks.filter(filterFn).some(n => enabledNetworks.includes(n.symbol))
                    ? 'Deactivate all'
                    : 'Activate all'}
            </ToggleAll>
        </Header>

        <Section>
            {networks.filter(filterFn).map(n => (
                <Row key={n.symbol}>
                    <Coin>
                        <CoinLogo size={24} symbol={n.symbol} />
                        <CoinName> {n.name}</CoinName>
                        <CoinSymbol> {n.symbol.toUpperCase()}</CoinSymbol>
                    </Coin>
                    <ActionColumn>
                        <Switch
                            onChange={(visible: boolean) => {
                                onToggleOneFn(n.symbol, visible);
                            }}
                            checked={enabledNetworks.includes(n.symbol)}
                        />
                    </ActionColumn>
                </Row>
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
                <H2>Coins to discover</H2>
                <P size="tiny">
                    Coins settings also defines the Discovery process when Trezor is connected. Each
                    time you connect not remembered device, Trezor Suite needs to find out what
                    accounts you have by going through each coin one by one. That can take between
                    few seconds to few minutes if you allow all or too many coins.
                </P>

                <CoinsGroup
                    label={<Translation>{messages.TR_COINS}</Translation>}
                    enabledNetworks={enabledNetworks}
                    filterFn={baseNetworksFilterFn}
                    onToggleOneFn={props.changeCoinVisibility}
                    onToggleAllFn={props.toggleGroupCoinsVisibility}
                />

                <CoinsGroup
                    label={<Translation>{messages.TR_TESTNET_COINS}</Translation>}
                    description={<Translation>{messages.TR_TESTNET_COINS_EXPLAINED}</Translation>}
                    enabledNetworks={enabledNetworks}
                    filterFn={testnetNetworksFilterFn}
                    onToggleOneFn={props.changeCoinVisibility}
                    onToggleAllFn={props.toggleGroupCoinsVisibility}
                />
            </div>
        </SuiteLayout>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
