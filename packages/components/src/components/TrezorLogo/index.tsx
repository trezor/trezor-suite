import React from 'react';
import PropTypes from 'prop-types';
import ReactSvg from 'react-svg';
import styled from 'styled-components';
import { LOGOS } from './logos';

const SvgWrapper = styled.div<Omit<Props, 'type'>>`
    display: inline-block;
    width: ${props => props.width};
    height: ${props => props.height};

    div {
        height: ${props => props.height};
    }
`;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    type: string;
    variant?: 'white' | 'black';
    width?: string | number;
    height?: string | number;
}

const TrezorLogo = ({ type, variant = 'black', width = 'auto', height = 'auto' }: Props) => {
    return (
        <SvgWrapper width={width} height={height}>
            <ReactSvg
                src={LOGOS[type.toUpperCase()]}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${width}`);
                    svg.setAttribute('height', `${height}`);
                    svg.setAttribute('fill', variant);
                }}
                loading={() => <span className="loading"></span>}
            />
        </SvgWrapper>
    );
};

TrezorLogo.propTypes = {
    type: PropTypes.oneOf(['horizontal', 'vertical']),
};

export default TrezorLogo;
