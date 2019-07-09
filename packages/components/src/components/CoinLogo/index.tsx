/* eslint-disable global-require */
import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Logo = styled.img<Omit<Props, 'network'>>`
    width: ${props => props.size}px;
    height: ${props => props.size}px;
`;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    network: string;
    className?: string;
    size?: number;
}

const CoinLogo = ({ network, size = 50, className, ...rest }: Props) => {
    return (
        <Logo
            className={className}
            size={size}
            // eslint-disable-next-line import/no-dynamic-require
            src={require(`../../images/coins/${network}.png`)}
            {...rest}
        />
    );
};

CoinLogo.propTypes = {
    network: PropTypes.string,
    className: PropTypes.string,
};

export default CoinLogo;
