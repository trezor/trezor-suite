import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { ICON_SIZE } from 'config/variables';

const Logo = styled.div`
    height: ${ICON_SIZE.BASE};
    width: ${ICON_SIZE.BASE};
    margin-right: 5px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: auto ${ICON_SIZE.BASE};
    background-image: url('${props => props.coinImg}');
`;

const CoinLogo = ({
    className, coinNetwork, coinImg,
}) => {
    let coinImgName = coinNetwork;
    if (coinImgName === 'ethereum') {
        coinImgName = 'eth';
    } else if (coinImgName === 'ethereum-classic') {
        coinImgName = 'etc';
    }
    const coinImgUrl = `../images/${coinImgName}-logo.png`;

    return (
        <Logo
            className={className}
            coinImg={coinImgName ? coinImgUrl : coinImg}
        />
    );
};

CoinLogo.propTypes = {
    className: PropTypes.string,
    coinImg: PropTypes.string,
    coinNetwork: PropTypes.string,
};

export default CoinLogo;
