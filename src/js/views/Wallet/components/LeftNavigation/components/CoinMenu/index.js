/* @flow */
import coins from 'constants/coins';
import colors from 'config/colors';
import Icon from 'components/Icon';
import ICONS from 'config/icons';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components';

import { FONT_SIZE, ICON_SIZE } from 'config/variables';

import Divider from '../Divider';
import Row from '../Row';

const CoinNameWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;
const Logo = styled.div`
    height: ${ICON_SIZE.BASE};
    width: ${ICON_SIZE.BASE};
    margin-right: 10px;

    background-repeat: no-repeat;
    background-position: center;
    background-size: auto ${ICON_SIZE.BASE};
    background-image: url('${props => props.coinImg}');
`;
const CoinName = ({
    coinImg, text,
}) => (
    <CoinNameWrapper>
        <Logo
            coinImg={coinImg}
        />
        <p>{text}</p>
    </CoinNameWrapper>
);
CoinName.propTypes = {
    coinImg: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
};

const RowCoinWrapper = styled.div`
    display: block;
    height: 50px;

    font-size: ${FONT_SIZE.BASE};
    color: ${colors.TEXT_PRIMARY};
    &:hover {
        background-color: ${colors.GRAY_LIGHT};
    }
`;
const RowCoin = ({
    coin, icon,
}) => (
    <RowCoinWrapper>
        <Row>
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
        </Row>
    </RowCoinWrapper>
);
RowCoin.propTypes = {
    coin: PropTypes.shape({
        img: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
    icon: PropTypes.shape({
        type: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
    }),
};


class CoinMenu extends Component {
    getBaseUrl() {
        const { selectedDevice } = this.props.wallet;
        let baseUrl = '';
        if (selectedDevice && selectedDevice.features) {
            baseUrl = `/device/${selectedDevice.features.device_id}`;
            if (selectedDevice.instance) {
                baseUrl += `:${selectedDevice.instance}`;
            }
        }

        return baseUrl;
    }

    render() {
        const { config } = this.props.localStorage;
        return (
            <React.Fragment>
                {config.coins.map((item) => {
                    let imgName = item.network;
                    if (item.network === 'ethereum') {
                        imgName = 'eth';
                    } else if (item.network === 'ethereum-classic') {
                        imgName = 'etc';
                    }
                    const imgUrl = `../images/${imgName}-logo.png`;

                    return (
                        <NavLink
                            key={item.network}
                            to={`${this.getBaseUrl()}/network/${item.network}/account/0`}
                        >
                            <RowCoin
                                coin={{
                                    img: imgUrl,
                                    name: item.name,
                                }}
                            />
                        </NavLink>
                    );
                })}
                <Divider
                    textLeft="Other coins"
                    textRight="(You will be redirected)"
                />
                {coins.map(coin => (
                    <a href={coin.url}>
                        <RowCoin
                            coin={{
                                img: coin.image,
                                name: coin.coinName,
                            }}
                            icon={{
                                type: ICONS.REDIRECT,
                                color: colors.TEXT_SECONDARY,
                            }}
                        />
                    </a>
                ))}
            </React.Fragment>
        );
    }
}

CoinMenu.propTypes = {
    config: PropTypes.object,
    wallet: PropTypes.object,
    selectedDevice: PropTypes.object,
    localStorage: PropTypes.object,
};

export default CoinMenu;
