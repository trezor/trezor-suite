import { FONT_SIZE, LINE_HEIGHT } from 'config/variables';
import styled from 'styled-components';

import PropTypes from 'prop-types';
import React from 'react';
import colors from 'config/colors';

const Wrapper = styled.p`
    font-size: ${props => props.size};
    line-height: ${LINE_HEIGHT.BASE};
    color: ${colors.TEXT_SECONDARY};
    padding: 0;
    margin: 0;
`;

const P = ({ children, className, size = FONT_SIZE.BASE }) => (
    <Wrapper className={className} size={size}>
        {children}
    </Wrapper>
);

P.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    size: PropTypes.string,
};

export default P;
