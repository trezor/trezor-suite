import styled, { css } from 'styled-components';

import { FONT_SIZE } from '../../config/variables';
import colors from '../../config/colors';

interface Props {
    textAlign?: 'left' | 'center' | 'right' | 'justify';
}

const textAlignStyle = css`
    text-align: ${(props: Props) => props.textAlign};
`;

const baseStyles = css`
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    margin: 0;
    padding: 0;
    ${(props: Props) => props.textAlign && textAlignStyle}
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
`;

const H1 = styled.h1<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H1};
    margin-bottom: 10px;
    color: ${colors.BLACK17};
    font-weight: 300;
`;

const H2 = styled.h2<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H2};
    margin-bottom: 10px;
    color: ${colors.BLACK0};
    font-weight: normal;
`;

export { H1, H2 };
