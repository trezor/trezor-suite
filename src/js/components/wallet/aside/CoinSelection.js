/* @flow */
import coins from 'constants/coins';
import colors from 'config/colors';
import ICONS from 'config/icons';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import AsideDivider from './AsideDivider';
import AsideRowCoin from './row/coin/AsideRowCoin';


import type { Props } from './index';


class CoinSelection extends Component {
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
            <React.Fragment>
                {config.coins.map((item) => {
                    let imgName = item.network;
                    if (item.network === 'ethereum') {
                        imgName = 'eth';
                    } else if (item.network === 'ethereum-classic') {
                        imgName = 'etc';
                    }
                    const imgUrl = `../images/${imgName}-logo.png`;

                    return (
                        <NavLink
                            key={item.network}
                            to={`${this.getBaseUrl()}/network/${item.network}/account/0`}
                        >
                            <AsideRowCoin
                                coin={{
                                    img: imgUrl,
                                    name: item.name,
                                }}
                            />
                        </NavLink>
                    );
                })}
                <AsideDivider
                    textLeft="Other coins"
                    textRight="(You will be redirected)"
                />
                {coins.map(coin => (
                    <a href={coin.url}>
                        <AsideRowCoin
                            coin={{
                                img: coin.image,
                                name: coin.coinName,
                            }}
                            icon={{
                                type: ICONS.REDIRECT,
                                color: colors.TEXT_SECONDARY,
                            }}
                        />
                    </a>
                ))}
            </React.Fragment>
        );
    }
}

CoinSelection.propTypes = {
    config: PropTypes.object,
    wallet: PropTypes.object,
    selectedDevice: PropTypes.object,
    localStorage: PropTypes.object,
};

export default CoinSelection;
