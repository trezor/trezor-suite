/* @flow */


import React from 'react';
import { Link, NavLink } from 'react-router-dom';

import type { Props } from './index';
import type { TrezorDevice } from '~/flowtype';

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
        return (
            <NavLink key={item.network} to={url} className={className}>
                { item.name }
            </NavLink>
        );
    });

    return (
        <section>
            { walletCoins }
            <div className="coin-divider">
                Other coins <span>(You will be redirected)</span>
            </div>
            <a href="https://wallet.trezor.io/#/coin/btc" className="coin btc external">
                Bitcoin
            </a>
            <a href="https://wallet.trezor.io/#/coin/ltc" className="coin ltc external">
                Litecoin
            </a>
            <a href="https://wallet.trezor.io/#/coin/bch" className="coin bch external">
                Bitcoin Cash
            </a>
            <a href="https://wallet.trezor.io/#/coin/btg" className="coin btg external">
                Bitcoin Gold
            </a>
            <a href="https://wallet.trezor.io/#/coin/dash" className="coin dash external">
                Dash
            </a>
            <a href="https://wallet.trezor.io/#/coin/zec" className="coin zec external">
                Zcash
            </a>
        </section>
    );
};

export default CoinSelection;