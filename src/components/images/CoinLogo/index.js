import React, { Component } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Wrapper = styled.div`
    padding-right: 20px;
    width: 40px;
`;

const Logo = styled.img`
    width: ${props => (props.hasLongIcon ? '15px' : '23px')};
    margin-left: ${props => (props.hasLongIcon ? '3px' : '0px')};
    display: block;
`;

class CoinLogo extends Component {
    constructor() {
        super();
        this.longIcons = ['etc', 'eth', 'trop'];
    }

    getIcon() {
        const { coinNetwork, coinId } = this.props;
        let coinImgName = coinNetwork;
        if (coinImgName === 'ethereum') {
            coinImgName = 'eth';
        } else if (coinImgName === 'ethereum-classic') {
            coinImgName = 'etc';
        }
        return coinImgName || coinId;
    }

    hasLongIcon(coinImgName) {
        let hasLongIcon = false;
        if (this.longIcons.includes(coinImgName)) {
            hasLongIcon = true;
        }
        return hasLongIcon;
    }

    render() {
        const iconName = this.getIcon();
        return (
            <Wrapper>
                <Logo
                    hasLongIcon={this.hasLongIcon(iconName)}
                    src={require(`./images/${iconName}.png`)} // eslint-disable-line
                />
            </Wrapper>
        );
    }
}

CoinLogo.propTypes = {
    coinId: PropTypes.string,
    coinNetwork: PropTypes.string,
};

export default CoinLogo;
