import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';

import { FONT_SIZE } from 'config/variables';
import colors from 'config/colors';

const baseStyles = css`
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    color: ${colors.TEXT_PRIMARY};
    font-weight: bold;
    margin: 0;
    padding: 0;
`;

const h1 = styled.h1`
    ${baseStyles};
    font-size: ${FONT_SIZE.H1};
    padding-bottom: 10px;
`;

const h2 = styled.h2`
    ${baseStyles};
    font-size: ${FONT_SIZE.H2};
    padding-bottom: 10px;
`;

const h3 = styled.h3`
    ${baseStyles};
    font-size: ${FONT_SIZE.H3};
    padding-bottom: 10px;
`;

const h4 = styled.h4`
    ${baseStyles};
    font-size: ${FONT_SIZE.H4};
    padding-bottom: 10px;
`;

const H1 = ({children}) => {
    return <h1>{children}</h1>
};

const H2 = ({children}) => {
    return <h2>{children}</h2>
};

const H3 = ({children}) => {
    return <h3>{children}</h3>
};

const H4 = ({children}) => {
    return <h4>{children}</h4>
};

H1.propTypes = {
    children: PropTypes.node,
};

H2.propTypes = {
    children: PropTypes.node,
};

H3.propTypes = {
    children: PropTypes.node,
};

H4.propTypes = {
    children: PropTypes.node,
};

export {
    H1, H2, H3, H4,
};
