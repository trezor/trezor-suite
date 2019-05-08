import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Logo = styled.img``;

interface Props {
    network: string;
    className?: string;
}

const CoinLogo = ({ network, className, ...rest }: Props) => {
    return (
        <Logo className={className} src={require(`../../images/coins/${network}.png`)} {...rest} />
    );
};

CoinLogo.propTypes = {
    network: PropTypes.string,
    className: PropTypes.string,
};

export default CoinLogo;
