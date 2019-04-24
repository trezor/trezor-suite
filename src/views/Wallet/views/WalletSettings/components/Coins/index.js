/* @flow */
import styled from 'styled-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { FONT_SIZE } from 'config/variables';
import coins from 'constants/coins';
import * as LocalStorageActions from 'actions/LocalStorageActions';
import type { Network } from 'flowtype';

import { colors, Switch, CoinLogo, Tooltip, Icon, icons as ICONS } from 'trezor-ui-components';
import l10nMessages from '../../index.messages';

type Props = {
    networks: Array<Network>,
    hiddenCoins: Array<string>,
    hiddenCoinsExternal: Array<string>,
    handleCoinVisibility: typeof LocalStorageActions.handleCoinVisibility,
    toggleGroupCoinsVisibility: typeof LocalStorageActions.toggleGroupCoinsVisibility,
};

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

const ToggleAll = styled.span`
    cursor: pointer;
`;

const CoinsSettings = (props: Props) => (
    <Wrapper>
        <Row>
            <Content>
                <Label>
                    <Left>
                        <FormattedMessage {...l10nMessages.TR_VISIBLE_COINS} />
                        <Tooltip
                            content={
                                <FormattedMessage {...l10nMessages.TR_VISIBLE_COINS_EXPLAINED} />
                            }
                            maxWidth={210}
                            placement="right"
                        >
                            <TooltipIcon
                                icon={ICONS.HELP}
                                color={colors.TEXT_SECONDARY}
                                size={12}
                            />
                        </Tooltip>
                    </Left>
                    <Right>
                        <ToggleAll
                            onClick={checked => {
                                const allCoins = props.networks
                                    .filter(x => !x.isHidden)
                                    .map(item => item.shortcut);

                                props.toggleGroupCoinsVisibility(allCoins, checked, false);
                            }}
                        >
                            {props.hiddenCoins.length > 0 ? 'Show all' : 'Hide all'}
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
                                            false
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
                                <FormattedMessage {...l10nMessages.TR_VISIBLE_COINS_EXPLAINED} />
                            }
                            maxWidth={210}
                            placement="right"
                        >
                            <TooltipIcon
                                icon={ICONS.HELP}
                                color={colors.TEXT_SECONDARY}
                                size={12}
                            />
                        </Tooltip>
                    </Left>
                    <Right>
                        <ToggleAll
                            onClick={checked => {
                                const allCoins = coins
                                    .filter(x => !x.isHidden)
                                    .map(coin => coin.id);

                                props.toggleGroupCoinsVisibility(allCoins, checked, true);
                            }}
                        >
                            Show all
                        </ToggleAll>
                    </Right>
                </Label>
                {coins
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
                                        props.handleCoinVisibility(network.id, visible, true);
                                    }}
                                    checked={!props.hiddenCoinsExternal.includes(network.id)}
                                />
                            </Right>
                        </CoinRow>
                    ))}
            </Content>
        </Row>
    </Wrapper>
);

export default CoinsSettings;
