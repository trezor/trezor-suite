import React, { PureComponent } from 'react';
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

class CoinLogo extends PureComponent {
    constructor() {
        super();
        this.longIcons = ['etc', 'eth', 'trop'];
    }

    hasLongIcon(network) {
        let hasLongIcon = false;
        if (this.longIcons.includes(network)) {
            hasLongIcon = true;
        }
        return hasLongIcon;
    }

    render() {
        const { network, className, standalone } = this.props;

        const logo = (
            <Logo
                className={className}
                hasLongIcon={this.hasLongIcon(network)}
                src={require(`images/coins/${network}.png`)} // eslint-disable-line
            />
        );

        if (standalone) {
            return logo;
        }

        return (
            <Wrapper className={className}>
                {logo}
            </Wrapper>
        );
    }
}

CoinLogo.propTypes = {
    network: PropTypes.string,
    className: PropTypes.string,
    standalone: PropTypes.bool,
};

export default CoinLogo;
