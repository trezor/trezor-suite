import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

import { coinProp } from './common';
import AsideRowCoin from './AsideRowCoin';

const Wrapper = styled(NavLink)`
    display: block;
`;

const AsideRowCoinWallet = ({ coin, url }) => (
    <Wrapper to={url}>
        <AsideRowCoin coin={coin}/>
    </Wrapper>
);

AsideRowCoinWallet.propTypes = {
    ...coinProp,
    url: PropTypes.string.isRequired,
};

export default AsideRowCoinWallet;
