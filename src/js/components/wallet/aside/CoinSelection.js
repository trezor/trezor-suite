/* @flow */
import coins from 'constants/coins';
import colors from 'config/colors';
import ICONS from 'config/icons';
import { NavLink } from 'react-router-dom';
import React from 'react';

import AsideDivider from './AsideDivider';
import AsideRowCoin from './row/coin/AsideRowCoin';


import type { Props } from './index';


const CoinSelection = (props: Props) => {
    const { config } = props.localStorage;
    const { selectedDevice } = props.wallet;

    let baseUrl: string = '';
    if (selectedDevice && selectedDevice.features) {
        baseUrl = `/device/${selectedDevice.features.device_id}`;
        if (selectedDevice.instance) {
            baseUrl += `:${selectedDevice.instance}`;
        }
    }

    const walletCoins = config.coins.map((item) => {
        const url = `${baseUrl}/network/${item.network}/account/0`;

        let imgName = item.network;
        if (item.network === 'ethereum') {
            imgName = 'eth';
        } else if (item.network === 'ethereum-classic') {
            imgName = 'etc';
        }
        const imgUrl = `../images/${imgName}-logo.png`;

        return (
            <NavLink to={url}>
                <AsideRowCoin
                    coin={{
                        img: imgUrl,
                        name: item.name,
                    }}
                />
            </NavLink>
        );
    });

    const externalCoins = coins.map(coin => (
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
    ));


    return (
        <AsideSection>
            { walletCoins }
            <AsideDivider
                textLeft="Other coins"
                textRight="(You will be redirected)"
            />
            { externalCoins }
        </AsideSection>
    );
};

export default CoinSelection;
