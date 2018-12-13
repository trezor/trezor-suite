import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Icon from 'components/Icon';
import CoinLogo from 'components/images/CoinLogo';
import { FONT_SIZE, LEFT_NAVIGATION_ROW } from 'config/variables';
import colors from 'config/colors';
import Row from '../Row';


const CoinNameWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const RowCoinWrapper = styled.div`
    padding: ${LEFT_NAVIGATION_ROW.PADDING};
    height: 50px;
    display: block;
    font-size: ${FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
    transition: background-color 0.3s, color 0.3s;
    
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
    network, iconLeft, iconRight,
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
                <CoinNameWrapper>
                    <CoinLogo network={network.shortcut} />
                    <p>{network.name}</p>
                </CoinNameWrapper>
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
    type: PropTypes.arrayOf(PropTypes.string).isRequired,
    color: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
};
RowCoin.propTypes = {
    network: PropTypes.shape({
        name: PropTypes.string.isRequired,
        shortcut: PropTypes.string,
    }).isRequired,
    iconLeft: PropTypes.shape(iconShape),
    iconRight: PropTypes.shape(iconShape),
};

export default RowCoin;
