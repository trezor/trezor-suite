import styled from 'styled-components';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import externalCoins from '@suite-config/externalCoins';
// import * as LocalStorageActions from 'actions/LocalStorageActions';
import { Network } from '@wallet-types/index';

import { colors, Switch, CoinLogo, Tooltip, Icon, variables } from '@trezor/components';
import l10nMessages from '../../index.messages';
import { AppState } from '@suite-types';

const { FONT_SIZE } = variables;

interface Props {
    networks: Network[]; // TODO
    hiddenCoins: AppState['wallet']['settings']['hiddenCoins'];
    hiddenCoinsExternal: AppState['wallet']['settings']['hiddenCoinsExternal'];
    // handleCoinVisibility: typeof LocalStorageActions.handleCoinVisibility;
    // toggleGroupCoinsVisibility: typeof LocalStorageActions.toggleGroupCoinsVisibility;
    handleCoinVisibility: any;
    toggleGroupCoinsVisibility: any;
}

interface StateProps {
    showAllCoins: boolean;
    showAllCoinsExternal: boolean;
}

interface NextProps {
    hiddenCoins: string[];
    hiddenCoinsExternal: string[];
}

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
    margin: 20px 0;
    flex-direction: column;
`;

const Label = styled.div`
    display: flex;
    padding: 10px 0;
    justify-content: space-between;
    color: ${colors.TEXT_SECONDARY};
    align-items: center;
`;

const TooltipIcon = styled(Icon)`
    margin-left: 6px;
    cursor: pointer;
`;

const CoinRow = styled.div`
    height: 50px;
    align-items: center;
    display: flex;
    border-bottom: 1px solid ${colors.DIVIDER};
    color: ${colors.TEXT_PRIMARY};
    justify-content: space-between;

    &:first-child {
        border-top: 1px solid ${colors.DIVIDER};
    }

    &:last-child {
        border-bottom: 0;
    }
`;

const Left = styled.div`
    display: flex;
    align-items: center;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
`;

const Name = styled.div`
    display: flex;
    font-size: ${FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
`;

const LogoWrapper = styled.div`
    display: flex;
    width: 45px;
    justify-content: center;
    align-items: center;
`;

const ToggleAll = styled.div`
    cursor: pointer;
`;

class CoinsSettings extends Component<Props, StateProps> {
    constructor(props: Props) {
        super(props);
        this.state = {
            showAllCoins: this.props.hiddenCoins.length === 0,
            showAllCoinsExternal: this.props.hiddenCoinsExternal.length === 0,
        };
    }

    componentWillReceiveProps(nextProps: NextProps) {
        if (nextProps.hiddenCoins.length > 0) {
            this.setState({ showAllCoins: false });
        } else {
            this.setState({
                showAllCoins: true,
            });
        }

        if (nextProps.hiddenCoinsExternal.length > 0) {
            this.setState({ showAllCoinsExternal: false });
        } else {
            this.setState({
                showAllCoinsExternal: true,
            });
        }
    }

    render() {
        const { props } = this;
        return (
            <Wrapper>
                <Row>
                    <Content>
                        <Label>
                            <Left>
                                <FormattedMessage {...l10nMessages.TR_VISIBLE_COINS} />
                                <Tooltip
                                    content={
                                        <FormattedMessage
                                            {...l10nMessages.TR_VISIBLE_COINS_EXPLAINED}
                                        />
                                    }
                                    maxWidth={210}
                                    placement="right"
                                >
                                    <TooltipIcon
                                        icon="HELP"
                                        color={colors.TEXT_SECONDARY}
                                        size={12}
                                    />
                                </Tooltip>
                            </Left>
                            <Right>
                                <ToggleAll
                                    onClick={() => {
                                        const allCoins = props.networks
                                            .filter(x => !x.isHidden)
                                            .map(item => item.shortcut);

                                        props.toggleGroupCoinsVisibility(
                                            allCoins,
                                            !this.state.showAllCoins,
                                            false,
                                        );
                                    }}
                                >
                                    {props.hiddenCoins.length === 0 ? 'Hide all' : 'Show all'}
                                </ToggleAll>
                            </Right>
                        </Label>
                        {props.networks
                            .filter(network => !network.isHidden)
                            .map(network => (
                                <CoinRow key={network.shortcut}>
                                    <Left>
                                        <LogoWrapper>
                                            <CoinLogo height="23" network={network.shortcut} />
                                        </LogoWrapper>
                                        <Name>{network.name}</Name>
                                    </Left>
                                    <Right>
                                        <Switch
                                            isSmall
                                            checkedIcon={false}
                                            uncheckedIcon={false}
                                            onChange={visible => {
                                                props.handleCoinVisibility(
                                                    network.shortcut,
                                                    visible,
                                                    false,
                                                );
                                            }}
                                            checked={!props.hiddenCoins.includes(network.shortcut)}
                                        />
                                    </Right>
                                </CoinRow>
                            ))}
                    </Content>
                    <Content>
                        <Label>
                            <Left>
                                <FormattedMessage {...l10nMessages.TR_VISIBLE_COINS_EXTERNAL} />
                                <Tooltip
                                    content={
                                        <FormattedMessage
                                            {...l10nMessages.TR_VISIBLE_COINS_EXPLAINED}
                                        />
                                    }
                                    maxWidth={210}
                                    placement="right"
                                >
                                    <TooltipIcon
                                        icon="HELP"
                                        color={colors.TEXT_SECONDARY}
                                        size={12}
                                    />
                                </Tooltip>
                            </Left>
                            <Right>
                                <ToggleAll
                                    onClick={() => {
                                        const allCoins = externalCoins
                                            .filter(x => !x.isHidden)
                                            .map(coin => coin.id);

                                        props.toggleGroupCoinsVisibility(
                                            allCoins,
                                            !this.state.showAllCoinsExternal,
                                            true,
                                        );
                                    }}
                                >
                                    {props.hiddenCoinsExternal.length === 0
                                        ? 'Hide all'
                                        : 'Show all'}
                                </ToggleAll>
                            </Right>
                        </Label>
                        {externalCoins
                            .sort((a, b) => a.order - b.order)
                            .map(network => (
                                <CoinRow key={network.id}>
                                    <Left>
                                        <LogoWrapper>
                                            <CoinLogo height="23" network={network.id} />
                                        </LogoWrapper>
                                        <Name>{network.coinName}</Name>
                                    </Left>
                                    <Right>
                                        <Switch
                                            isSmall
                                            checkedIcon={false}
                                            uncheckedIcon={false}
                                            onChange={visible => {
                                                props.handleCoinVisibility(
                                                    network.id,
                                                    visible,
                                                    true,
                                                );
                                            }}
                                            checked={
                                                !props.hiddenCoinsExternal.includes(network.id)
                                            }
                                        />
                                    </Right>
                                </CoinRow>
                            ))}
                    </Content>
                </Row>
            </Wrapper>
        );
    }
}

export default CoinsSettings;
