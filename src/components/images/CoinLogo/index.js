import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Wrapper = styled.div`
    padding-right: 20px;
    width: 40px;
    display: flex;
    justify-content: center;
`;

const Logo = styled.img`
    height: 23px;
    display: block;
`;

class CoinLogo extends PureComponent {
    render() {
        const { network, className, standalone } = this.props;

        const logo = (
            <Logo
                className={className}
                src={require(`images/coins/${network}.png`)} // eslint-disable-line
            />
        );

        if (standalone) {
            return logo;
        }

        return <Wrapper className={className}>{logo}</Wrapper>;
    }
}

CoinLogo.propTypes = {
    network: PropTypes.string,
    className: PropTypes.string,
    standalone: PropTypes.bool,
};

export default CoinLogo;
