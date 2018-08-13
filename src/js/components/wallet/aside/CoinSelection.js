import React, { Component } from 'react';
import PropTypes from 'prop-types';
import colors from '~/js/config/colors';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import navigationConstants from '~/js/constants/navigation';

const Wrapper = styled.div`
    padding: 0 0 20px 0;
`;

const ImgActive = styled.img`
    margin-right: 20px;
`;

const ImgRedirect = styled.img`
    margin-right: 15px;
`;

const Link = styled(NavLink)`
    display: flex;
    align-items: center;
`;

const LinkRedirect = styled.a`
    display: flex;
    align-items: center;
`;

const Divider = styled.div`
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    color: ${colors.TEXT_SECONDARY};
    background: ${colors.GRAY_LIGHT};
    padding: 8px 28px 8px 24px;
    border-top: 1px solid ${colors.DIVIDER};
    border-bottom: 1px solid ${colors.DIVIDER};
`;

const RedirectText = styled.span`
    display: flex;
    justify-content: flex-end;
`;

const Name = styled.div`
    height: 100%;
`;

class CoinSelection extends Component {
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

    getImagePath(symbol, network) {
        const coindId = (symbol === 'tETH' ? network : symbol);
        return `../../../../images/${coindId}-logo.png`;
    }

    render() {
        const { config } = this.props.localStorage;
        return (
            <Wrapper>
                {config.coins.map(item => (
                    <Link
                        key={item.network}
                        to={`${this.getBaseUrl()}/network/${item.network}/account/0`}
                    >
                        <ImgActive width="12px" src={this.getImagePath(item.symbol, item.network)} />
                        <Name>{ item.name }</Name>
                    </Link>
                ))}
                <Divider>
                    Other coins <RedirectText>(You will be redirected)</RedirectText>
                </Divider>
                {navigationConstants.map(item => (
                    <LinkRedirect
                        key={item.coinName}
                        rel="noopener noreferrer"
                        target="_blank"
                        href={item.url}
                    >
                        <ImgRedirect src={item.image} width="20px" />
                        {item.coinName}
                    </LinkRedirect>
                ))}
            </Wrapper>
        );
    }
}

CoinSelection.propTypes = {
    config: PropTypes.object,
    wallet: PropTypes.object,
    selectedDevice: PropTypes.object,
    localStorage: PropTypes.object,
};

export default CoinSelection;