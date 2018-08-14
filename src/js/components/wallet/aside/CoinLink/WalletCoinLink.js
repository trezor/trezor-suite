import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import { coinProp } from './common';
import CoinLink from './CoinLink';

const Wrapper = styled(NavLink)`
    display: block;
`;

const WalletCoinLink = ({ coin, url }) => (
    <Wrapper to={url}>
        <CoinLink coin={coin}/>
    </Wrapper>
);

WalletCoinLink.propTypes = {
    ...coinProp,
    url: PropTypes.string.isRequired,
};

export default WalletCoinLink;
