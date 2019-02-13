import { FONT_SIZE, LINE_HEIGHT } from 'config/variables';
import styled, { css } from 'styled-components';

import PropTypes from 'prop-types';
import React from 'react';
import colors from 'config/colors';

const Wrapper = styled.p`
    font-size: ${FONT_SIZE.BIG};
    line-height: ${LINE_HEIGHT.BASE};
    color: ${colors.TEXT_SECONDARY};
    padding: 0;
    margin: 0;

    ${props => props.isSmaller && css`
        font-size: ${FONT_SIZE.SMALL};
    `}
`;

const P = ({ children, className, isSmaller = false }) => (
    <Wrapper
        className={className}
        isSmaller={isSmaller}
    >{children}
    </Wrapper>
);

P.propTypes = {
    className: PropTypes.string,
    isSmaller: PropTypes.bool,
    children: PropTypes.node,
};

export default P;
