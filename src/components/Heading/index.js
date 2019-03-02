import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';

import { FONT_SIZE } from 'config/variables';
import colors from 'config/colors';

const Props = {
    children: PropTypes.node,
};

const baseStyles = css`
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    color: ${colors.TEXT_PRIMARY};
    font-weight: bold;
    margin: 0;
    padding: 0;
`;

const H1 = styled.h1`
    ${baseStyles};
    font-size: ${FONT_SIZE.H1};
    padding-bottom: 10px;
`;

const H2 = styled.h2`
    ${baseStyles};
    font-size: ${FONT_SIZE.H2};
    padding-bottom: 10px;
`;

const H3 = styled.h3`
    ${baseStyles};
    font-size: ${FONT_SIZE.H3};
    padding-bottom: 10px;
`;

const H4 = styled.h4`
    ${baseStyles};
    font-size: ${FONT_SIZE.H4};
    padding-bottom: 10px;
`;

const H5 = styled.h5`
    ${baseStyles};
    font-size: ${FONT_SIZE.H5};
    padding-bottom: 10px;
`;

const H6 = styled.h6`
    ${baseStyles};
    font-size: ${FONT_SIZE.H6};
    padding-bottom: 10px;
`;

H1.propTypes = Props;
H2.propTypes = Props;
H3.propTypes = Props;
H4.propTypes = Props;
H5.propTypes = Props;
H6.propTypes = Props;

export {
    H1, H2, H3, H4, H5, H6,
};
