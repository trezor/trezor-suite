import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import AsideRow from './AsideRow';
import CoinName from './CoinName';

import { coinProp } from './common';

const Wrapper = styled(NavLink)`
    display: block;
`;

const AsideRowCoinWallet = ({ coin, url }) => (
    <Wrapper to={url}>
        <AsideRow>
            <CoinName
                coinImg={coin.img}
                text={coin.name}
            />
        </AsideRow>
    </Wrapper>
);

AsideRowCoinWallet.propTypes = {
    ...coinProp,
    url: PropTypes.string.isRequired,
};

export default AsideRowCoinWallet;
