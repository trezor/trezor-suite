import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import ICONS from 'config/icons';
import colors from 'config/colors';

import Icon from 'components/common/Icon';
import AsideRow from './AsideRow';
import AsideRowCoin from './AsideRowCoin';
import CoinName from './CoinName';

import { coinProp } from './common';

const AsideRowCoinExternal = ({ coin, url }) => (
    <a href={url}>
        <AsideRowCoin>
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
        </AsideRowCoin>
    </a>
);

AsideRowCoinExternal.propTypes = {
    ...coinProp,
    url: PropTypes.string,
};

export default AsideRowCoinExternal;
