import styled from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import colors from 'config/colors';
import { ICON_SIZE } from 'config/variables';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    p {
        color: ${colors.TEXT_PRIMARY};
    }
`;

const Logo = styled.div`
    height: ${ICON_SIZE.BASE};
    width: ${ICON_SIZE.BASE};
    margin-right: 10px;

    background-repeat: no-repeat;
    background-position: center;
    background-size: auto ${ICON_SIZE.BASE};
    background-image: url('images/${props => props.coinImg}-logo.png');
`;

const CoinName = ({ coinImg, text }) => (
    <Wrapper>
        <Logo
            coinImg={coinImg}
        />
        <p>{text}</p>
    </Wrapper>
);

CoinName.propTypes = {
    coinImg: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
};

export default CoinName
