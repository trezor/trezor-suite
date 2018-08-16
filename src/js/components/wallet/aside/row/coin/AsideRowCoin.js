
import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';
import Icon from 'components/common/Icon';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

import AsideRow from '../AsideRow';
import CoinName from './CoinName';
import { coinProp } from '../../common';

const Wrapper = styled.div`
    display: block;
    height: 50px;

    font-size: ${FONT_SIZE.BASE};
    color: ${colors.TEXT_PRIMARY};
    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }
`;

const AsideRowCoin = ({ coin, icon }) => (
    <Wrapper>
        <AsideRow>
            <CoinName
                coinImg={coin.img}
                text={coin.name}
            />
            {icon && (
                <Icon
                    icon={icon.type}
                    color={icon.color}
                />
            )}
        </AsideRow>
    </Wrapper>
);

AsideRowCoin.propTypes = {
    ...coinProp,
    icon: PropTypes.shape({
        type: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
    }),
};

export default AsideRowCoin;
