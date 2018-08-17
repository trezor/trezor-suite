import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { ICON_SIZE } from 'config/variables';

const CoinNameWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Logo = styled.div`
    height: ${ICON_SIZE.BASE};
    width: ${ICON_SIZE.BASE};
    margin-right: 5px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: auto ${ICON_SIZE.BASE};
    background-image: url('${props => props.coinImg}');
`;

const CoinName = ({
    coinImg, text,
}) => (
    <CoinNameWrapper>
        {coinImg && <Logo coinImg={coinImg} />}
        <p>{text}</p>
    </CoinNameWrapper>
);
CoinName.propTypes = {
    coinImg: PropTypes.string,
    text: PropTypes.string.isRequired,
};

export default CoinName;
