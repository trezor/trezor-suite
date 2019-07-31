/* eslint-disable global-require */
import React from 'react';
import PropTypes from 'prop-types';
import ReactSvg from 'react-svg';
import styled from 'styled-components';
import { Omit } from '../../support/types';
import { COINS } from './coins';

const StyledSvg = styled(ReactSvg)<Omit<Props, 'network'>>`
    width: ${props => props.size}px;
    height: ${props => props.size}px;
    display: inline-block;

    div {
        height: ${props => props.size}px;
    }
`;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    network: string;
    className?: string;
    size?: number;
}

const CoinLogo = ({ network, className, size = 32, ...rest }: Props) => {
    return <StyledSvg className={className} src={COINS[network]} size={size} {...rest} />;
};

CoinLogo.propTypes = {
    network: PropTypes.string,
    className: PropTypes.string,
};

export default CoinLogo;
