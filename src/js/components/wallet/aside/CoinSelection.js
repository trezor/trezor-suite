/* @flow */

import React from 'react';
import { NavLink } from 'react-router-dom';

import coins from 'constants/coins';

import AsideDivider from './AsideDivider';
import AsideRowCoinWallet from './AsideRowCoinWallet';
import AsideRowCoinExternal from './AsideRowCoinExternal';
import AsideSection from './AsideSection';

import type { TrezorDevice } from 'flowtype';
import type { Props } from './index';


const CoinSelection = (props: Props): React$Element<string> => {
    const { location } = props.router;
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
        const className = `coin ${item.network}`;

        let coinImg = item.network;
        if (item.network === 'ethereum') {
            coinImg = 'eth';
        } else if (item.network === 'ethereum-classic' ) {
            coinImg = 'etc';
        }

        return (
            <AsideRowCoinWallet
                key={item.network}
                coin={{
                    img: coinImg,
                    name: item.name,
                }}
                url={url}
            />
        );
    });

    const externalCoins = coins.map(coin => (
        <AsideDivider
            coin={{
                img: coin.image,
                name: coin.coinName,
            }}
            url={coin.url}
        />
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
