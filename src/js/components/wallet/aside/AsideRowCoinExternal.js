import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import Icon from 'components/common/Icon';
import AsideRow from './AsideRow';
import CoinName from './CoinName';

import ICONS from 'constants/icons';
import colors from 'config/colors';
import { coinProp } from './common';

const A = styled.a`
    display: block;
`;

const AsideRowCoinExternal = ({ coin, url }) => (
    <A href={url}>
        <AsideRow>
            <CoinName
                coinImg={coin.img}
                text={coin.name}
            />
            <Icon
                icon={ICONS.REDIRECT}
                color={colors.TEXT_SECONDARY}
            />
        </AsideRow>
    </A>
);

AsideRowCoinExternal.propTypes = {
    ...coinProp,
    url: PropTypes.string,
};

export default AsideRowCoinExternal;
