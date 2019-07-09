/* eslint-disable global-require */
import React from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';

const LOGOS: { [key: string]: any } = {
    ada: require('../../images/coins/ada.png'),
    bch: require('../../images/coins/bch.png'),
    btc: require('../../images/coins/btc.png'),
    btg: require('../../images/coins/btg.png'),
    dash: require('../../images/coins/dash.png'),
    dgb: require('../../images/coins/dgb.png'),
    doge: require('../../images/coins/doge.png'),
    etc: require('../../images/coins/etc.png'),
    eth: require('../../images/coins/eth.png'),
    ltc: require('../../images/coins/ltc.png'),
    nem: require('../../images/coins/nem.png'),
    nmc: require('../../images/coins/nmc.png'),
    rinkeby: require('../../images/coins/rinkeby.png'),
    trop: require('../../images/coins/trop.png'),
    txrp: require('../../images/coins/txrp.png'),
    vtc: require('../../images/coins/vtc.png'),
    xem: require('../../images/coins/xem.png'),
    xlm: require('../../images/coins/xlm.png'),
    xrp: require('../../images/coins/xrp.png'),
    xtz: require('../../images/coins/xtz.png'),
    zec: require('../../images/coins/zec.png'),
};

const Logo = styled.Image<Omit<Props, 'network'>>`
    width: ${props => props.size};
    height: ${props => props.size};
`;

interface Props {
    network: string;
    size?: number;
}

const CoinLogo = ({ network, size = 50, ...rest }: Props) => {
    return (
        // eslint-disable-next-line import/no-dynamic-require(
        <Logo source={LOGOS[network]} size={size} {...rest} />
    );
};

CoinLogo.propTypes = {
    network: PropTypes.string,
};

export default CoinLogo;
