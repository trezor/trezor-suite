import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Icon from 'components/Icon';
import { FONT_SIZE } from 'config/variables';
import colors from 'config/colors';
import Row from '../Row';
import CoinName from './components/CoinName';

const RowCoinWrapper = styled.div`
    padding: 16px 24px;
    height: 50px;
    display: block;
    font-size: ${FONT_SIZE.BASE};
    color: ${colors.TEXT_PRIMARY};
    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }
`;

const Left = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const IconWrapper = styled.div`
    margin-right: 10px;
`;

const RowCoin = ({
    coin, iconLeft, iconRight,
}) => (
    <RowCoinWrapper>
        <Row>
            <Left>
                {iconLeft && (
                    <IconWrapper>
                        <Icon
                            icon={iconLeft.type}
                            size={iconLeft.size}
                            color={iconLeft.color}
                        />
                    </IconWrapper>
                )}
                <CoinName
                    coinImg={coin.img}
                    text={coin.name}
                />
            </Left>
            {iconRight && (
                <Icon
                    icon={iconRight.type}
                    size={iconRight.size}
                    color={iconRight.color}
                />
            )}
        </Row>
    </RowCoinWrapper>
);

const iconShape = {
    type: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
};
RowCoin.propTypes = {
    coin: PropTypes.shape({
        img: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
    iconLeft: PropTypes.shape(iconShape),
    iconRight: PropTypes.shape(iconShape),
};

export default RowCoin;
