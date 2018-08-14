/* @flow */

import styled from 'styled-components';
import React from 'react';
import { NavLink } from 'react-router-dom';

import { ExternalCoinLink, WalletCoinLink } from './CoinLink/';
import AsideDivider from './AsideDivider';

import type { TrezorDevice } from 'flowtype';
import type { Props } from './index';

const Section = styled.section`
    width: 320px;
    display: inline-block;
    vertical-align: top;
`;

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
            <WalletCoinLink
                key={item.network}
                coin={{
                    img: coinImg,
                    name: item.name,
                }}
                url={url}
            />
        );
    });

    return (
        <Section>
            { walletCoins }
            <div className="coin-divider">
                Other coins <span>(You will be redirected)</span>

            <ExternalCoinLink
                coin={{
                    img: 'btc',
                    name: 'Bitcoin',
                }}
                url={'https://wallet.trezor.io/#/coin/ltc'}
            />
            <ExternalCoinLink
                coin={{
                    img: 'ltc',
                    name: 'Litecoin',
                }}
                url={'https://wallet.trezor.io/#/coin/ltc'}
            />
            <ExternalCoinLink
                coin={{
                    img: 'bch',
                    name: 'Bitcoin Cash',
                }}
                url={'https://wallet.trezor.io/#/coin/bch'}
            />
            <ExternalCoinLink
                coin={{
                    img: 'btg',
                    name: 'Bitcoin Gold',
                }}
                url={'https://wallet.trezor.io/#/coin/btg'}
            />
            <ExternalCoinLink
                coin={{
                    img: 'Dash',
                    name: 'Dash',
                }}
                url={'https://wallet.trezor.io/#/coin/dash'}
            />
            <ExternalCoinLink
                coin={{
                    img: 'zec',
                    name: 'Zcash',
                }}
                url={'https://wallet.trezor.io/#/coin/zec'}
            />
        </Section>
    );
};

export default CoinSelection;
