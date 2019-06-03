import styled, { css } from 'styled-components/native';

import PropTypes from 'prop-types';
import React from 'react';
import { FONT_SIZE_NATIVE as FONT_SIZE, LINE_HEIGHT } from '../../config/variables';
import colors from '../../config/colors';

const P_SIZES: { [key: string]: string } = {
    small: FONT_SIZE.SMALL,
    medium: FONT_SIZE.BASE,
    large: FONT_SIZE.BIG,
    xlarge: FONT_SIZE.BIGGER,
};

const Paragraph = styled.Text<Props>`
    font-size: ${props => props.size};
    line-height: ${LINE_HEIGHT.BASE};
    color: ${colors.TEXT_SECONDARY};
    padding: 0;
    margin: 0;
    ${props =>
        props.textAlign &&
        css`
            text-align: ${props.textAlign};
        `}
`;

interface Props {
    children: React.ReactNode;
    className?: string;
    size?: string;
    textAlign?: string;
}

const P = ({ children, className, size = 'medium', textAlign, ...rest }: Props) => (
    <Paragraph className={className} size={P_SIZES[size]} textAlign={textAlign} {...rest}>
        {children}
    </Paragraph>
);

P.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
    textAlign: PropTypes.oneOf(['left', 'center', 'right', 'justify', 'inherit', 'initial']),
};

export default P;
