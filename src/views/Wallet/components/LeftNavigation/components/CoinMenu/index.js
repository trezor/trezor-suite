/* @flow */

import styled from 'styled-components';
import coins from 'constants/coins';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Link, colors, icons as ICONS } from 'trezor-ui-components';
import { NavLink } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import Divider from '../Divider';
import RowCoin from '../RowCoin';

import l10nMessages from './index.messages';

import type { Props } from '../common';

const Wrapper = styled.div``;

const ExternalWallet = styled.div`
    cursor: pointer;
`;

const StyledLink = styled(Link)`
    &:hover {
        text-decoration: none;
    }
`;

const Empty = styled.span`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50px;
`;

const StyledLinkEmpty = styled(Link)`
    padding: 0;
`;

const Gray = styled.span`
    color: ${colors.TEXT_SECONDARY};
`;

class CoinMenu extends PureComponent<Props> {
    getBaseUrl() {
        const { selectedDevice } = this.props.wallet;
        let baseUrl = '';
        if (selectedDevice && selectedDevice.features) {
            baseUrl = `/device/${selectedDevice.features.device_id}`;
            if (selectedDevice.instance) {
                baseUrl += `:${selectedDevice.instance}`;
            }
        }

        return baseUrl;
    }

    getOtherCoins() {
        const { hiddenCoins } = this.props.wallet;
        return coins
            .sort((a, b) => a.order - b.order)
            .filter(item => !item.isHidden) // hide coins globally in config
            .filter(item => !hiddenCoins.includes(item.id))
            .map(coin => {
                const row = (
                    <RowCoin
                        network={{
                            name: coin.coinName,
                            shortcut: coin.id,
                        }}
                        iconRight={{
                            type: ICONS.SKIP,
                            color: colors.TEXT_SECONDARY,
                            size: 13,
                        }}
                    />
                );

                if (coin.external)
                    return (
                        <ExternalWallet
                            key={coin.id}
                            onClick={() => this.props.gotoExternalWallet(coin.id, coin.url)}
                        >
                            {row}
                        </ExternalWallet>
                    );
                return (
                    <StyledLink isGray key={coin.id} href={coin.url} target="_top">
                        {row}
                    </StyledLink>
                );
            });
    }

    isTopMenuEmpty() {
        const numberOfVisibleNetworks = this.props.localStorage.config.networks
            .filter(item => !item.isHidden) // hide coins globally in config
            .filter(item => !this.props.wallet.hiddenCoins.includes(item.shortcut));

        return numberOfVisibleNetworks.length <= 0;
    }

    isBottomMenuEmpty() {
        const { hiddenCoins } = this.props.wallet;
        const numberOfVisibleNetworks = coins
            .filter(item => !item.isHidden)
            .filter(item => !hiddenCoins.includes(item.id));

        return numberOfVisibleNetworks.length <= 0;
    }

    isMenuEmpty() {
        return this.isTopMenuEmpty() && this.isBottomMenuEmpty();
    }

    render() {
        const { hiddenCoins } = this.props.wallet;
        const { config } = this.props.localStorage;
        return (
            <Wrapper data-test="Main__page__coin__menu">
                {this.isMenuEmpty() && (
                    <Empty>
                        <Gray>
                            <FormattedMessage
                                {...l10nMessages.TR_SELECT_COINS}
                                values={{
                                    TR_SELECT_COINS_LINK: (
                                        <StyledLinkEmpty to="/settings">
                                            <FormattedMessage
                                                {...l10nMessages.TR_SELECT_COINS_LINK}
                                            />
                                        </StyledLinkEmpty>
                                    ),
                                }}
                            />{' '}
                        </Gray>
                    </Empty>
                )}
                {config.networks
                    .filter(item => !item.isHidden) // hide coins globally in config
                    .filter(item => !hiddenCoins.includes(item.shortcut)) // hide coins by user settings
                    .sort((a, b) => a.order - b.order)
                    .map(item => (
                        <NavLink
                            key={item.shortcut}
                            to={`${this.getBaseUrl()}/network/${item.shortcut}/account/0`}
                        >
                            <RowCoin
                                network={{
                                    name: item.name,
                                    shortcut: item.shortcut,
                                }}
                            />
                        </NavLink>
                    ))}
                {!this.isBottomMenuEmpty() && (
                    <Divider
                        testId="Main__page__coin__menu__divider"
                        textLeft={<FormattedMessage {...l10nMessages.TR_OTHER_COINS} />}
                        hasBorder
                    />
                )}
                {this.getOtherCoins()}
            </Wrapper>
        );
    }
}

CoinMenu.propTypes = {
    localStorage: PropTypes.object.isRequired,
    wallet: PropTypes.object.isRequired,
    gotoExternalWallet: PropTypes.func.isRequired,
};

export default CoinMenu;
