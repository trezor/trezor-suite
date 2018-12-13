import styled, { css } from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';

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

    ${props => props.claim
        && css`
            font-size: ${FONT_SIZE.HUGE};
            padding-bottom: 24px;
        `};
`;

const H3 = styled.h3`
    ${baseStyles};
    font-size: ${FONT_SIZE.H3};
    margin-bottom: 10px;
`;

const H4 = styled.h4`
    ${baseStyles};
    font-size: ${FONT_SIZE.H4};
    padding-bottom: 10px;
`;

export {
    H1, H2, H3, H4,
};
