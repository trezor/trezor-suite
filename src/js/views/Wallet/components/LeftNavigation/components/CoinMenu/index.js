/* @flow */
import coins from 'constants/coins';
import colors from 'config/colors';
import ICONS from 'config/icons';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import Divider from '../Divider';
import RowCoin from '../RowCoin';

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
                            <RowCoin
                                coin={{
                                    img: imgUrl,
                                    name: item.name,
                                }}
                            />
                        </NavLink>
                    );
                })}
                <Divider
                    textLeft="Other coins"
                    textRight="(You will be redirected)"
                />
                {coins.map(coin => (
                    <a key={coin.url} href={coin.url}>
                        <RowCoin
                            coin={{
                                img: coin.image,
                                name: coin.coinName,
                            }}
                            iconRight={{
                                type: ICONS.SKIP,
                                color: colors.TEXT_SECONDARY,
                                size: 27,
                            }}
                        />
                    </a>
                ))}
            </React.Fragment>
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
