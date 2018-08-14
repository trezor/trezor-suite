import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import ICONS from 'constants/icons';
import colors from 'config/colors';

import { coinProp } from './common';
import CoinLink from './CoinLink';

const A = styled.a`
    display: block;
`;

const ExternalCoinLink = ({ coin, url }) => (
    <A href={url}>
        <CoinLink
            coin={coin}
            iconRight={{
                type: ICONS.REDIRECT,
                color: colors.TEXT_SECONDARY,
            }}
        />
    </A>
);

ExternalCoinLink.propTypes = {
    ...coinProp,
    url: PropTypes.string,
};

export default ExternalCoinLink;
