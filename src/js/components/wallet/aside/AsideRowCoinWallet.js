import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import AsideRow from './AsideRow';
import AsideRowCoin from './AsideRowCoin';
import CoinName from './CoinName';

import { coinProp } from './common';

const AsideRowCoinWallet = ({ coin, url }) => (
    <NavLink to={url}>
        <AsideRowCoin>
            <AsideRow>
                <CoinName
                    coinImg={coin.img}
                    text={coin.name}
                />
            </AsideRow>
        </AsideRowCoin>
    </NavLink>
);

AsideRowCoinWallet.propTypes = {
    ...coinProp,
    url: PropTypes.string.isRequired,
};

export default AsideRowCoinWallet;
