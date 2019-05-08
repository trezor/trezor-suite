import styled, { css } from 'styled-components';

import { FONT_SIZE } from 'config/variables';
import colors from 'config/colors';

interface Props {
    textAlign: 'left' | 'center' | 'right' | 'justify';
}

const textAlignStyle = css`
    text-align: ${(props: Props) => props.textAlign};
`;

const baseStyles = css`
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    color: ${colors.TEXT_PRIMARY};
    font-weight: bold;
    margin: 0;
    padding: 0;
    ${(props: Props) => props.textAlign && textAlignStyle}
`;

const H1 = styled.h1<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H1};
    padding-bottom: 10px;
`;

const H2 = styled.h2<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H2};
    padding-bottom: 10px;
`;

const H3 = styled.h3<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H3};
    padding-bottom: 10px;
`;

const H4 = styled.h4<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H4};
    padding-bottom: 10px;
`;

const H5 = styled.h5<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H5};
    padding-bottom: 10px;
`;

const H6 = styled.h6<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H6};
    padding-bottom: 10px;
`;

export { H1, H2, H3, H4, H5, H6 };
