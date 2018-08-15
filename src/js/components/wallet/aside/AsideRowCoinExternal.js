import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import ICONS from 'constants/icons';
import colors from 'config/colors';

import { coinProp } from './common';
import AsideRowCoin from './AsideRowCoin';

const A = styled.a`
    display: block;
`;

const AsideRowCoinExternal = ({ coin, url }) => (
    <A href={url}>
        <AsideRowCoin
            coin={coin}
            iconRight={{
                type: ICONS.REDIRECT,
                color: colors.TEXT_SECONDARY,
            }}
        />
    </A>
);

AsideRowCoinExternal.propTypes = {
    ...coinProp,
    url: PropTypes.string,
};

export default AsideRowCoinExternal;
