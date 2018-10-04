import styled from 'styled-components';
import coins from 'constants/coins';
import colors from 'config/colors';
import ICONS from 'config/icons';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Divider from '../Divider';
import RowCoin from '../RowCoin';

const Wrapper = styled.div``;

class CoinMenu extends Component {
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
                {coins.map(coin => (
                    <a key={this.getCoinUrl(coin.id)} href={coin.url}>
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
                    </a>
                ))}
            </Wrapper>
        );
    }
}

CoinMenu.propTypes = {
    config: PropTypes.object,
    wallet: PropTypes.object,
    selectedDevice: PropTypes.object,
    localStorage: PropTypes.object,
};

export default CoinMenu;
