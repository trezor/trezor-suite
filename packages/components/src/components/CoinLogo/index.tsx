/* eslint-disable global-require */
import React from 'react';
import PropTypes from 'prop-types';
import ReactSvg from 'react-svg';
import styled from 'styled-components';
import { Omit } from '../../support/types';
import { COINS } from './coins';

const SvgWrapper = styled.div<Omit<Props, 'network'>>`
    display: inline-block;
    height: ${props => props.size}px;

    div {
        height: ${props => props.size}px;
        line-height: ${props => props.size}px;
    }
`;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    network: string;
    className?: string;
    size?: number;
}

const CoinLogo = ({ network, className, size = 32, ...rest }: Props) => {
    return (
        <SvgWrapper className={className} size={size} {...rest}>
            <ReactSvg
                src={COINS[network]}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                }}
                loading={() => <span className="loading"></span>}
            />
        </SvgWrapper>
    );
};

CoinLogo.propTypes = {
    network: PropTypes.string,
    className: PropTypes.string,
};

export default CoinLogo;
