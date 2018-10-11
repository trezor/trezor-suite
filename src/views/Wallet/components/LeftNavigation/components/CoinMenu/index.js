/* @flow */

import styled from 'styled-components';
import coins from 'constants/coins';
import colors from 'config/colors';
import ICONS from 'config/icons';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';
import Link from 'components/Link';
import Divider from '../Divider';
import RowCoin from '../RowCoin';

import type { Props } from '../common';

const Wrapper = styled.div``;

const ExternalWallet = styled.div`
    cursor: pointer;
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
        return coins.map((coin) => {
            const row = (
                <RowCoin
                    coin={{
                        name: coin.coinName,
                        id: coin.id,
                    }}
                    iconRight={{
                        type: ICONS.SKIP,
                        color: colors.TEXT_SECONDARY,
                        size: 27,
                    }}
                />
            );

            if (coin.external) return <ExternalWallet key={coin.id} onClick={() => this.props.gotoExternalWallet(coin.id, coin.url)}>{row}</ExternalWallet>;
            return <Link key={coin.id} href={coin.url} target="_top">{row}</Link>;
        });
    }

    render() {
        const { config } = this.props.localStorage;
        return (
            <Wrapper>
                {config.coins.map(item => (
                    <NavLink
                        key={item.network}
                        to={`${this.getBaseUrl()}/network/${item.network}/account/0`}
                    >
                        <RowCoin
                            coin={{
                                name: item.name,
                                network: item.network,
                            }}
                        />
                    </NavLink>
                ))}
                <Divider
                    textLeft="Other coins"
                    textRight="(You will be redirected)"
                    hasBorder
                />
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
