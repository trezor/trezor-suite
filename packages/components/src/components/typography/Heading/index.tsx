import styled, { css } from 'styled-components';

import { NEUE_FONT_SIZE, FONT_WEIGHT, FONT_SIZE } from '../../../config/variables';

export interface Props {
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    noMargin?: boolean;
    fontWeight?: typeof FONT_WEIGHT[keyof typeof FONT_WEIGHT];
}

const textAlignStyle = css`
    text-align: ${(props: Props) => props.textAlign};
`;

const fontWeightStyle = css`
    font-weight: ${(props: Props) => props.fontWeight};
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
    ${(props: Props) => props.fontWeight && fontWeightStyle}
    color: ${props => props.theme.TYPE_DARK_GREY};

    ${props =>
        !props.noMargin &&
        css`
            margin-bottom: 10px;
        `};
`;

const H1 = styled.h1<Props>`
    ${baseStyles};
    font-size: ${NEUE_FONT_SIZE.H1};
    line-height: 34px;
    font-weight: normal;
`;

const H2 = styled.h2<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H2};
    line-height: 32px;
    font-weight: ${(props: Props) => props.fontWeight || 500};
    margin: 0;
`;

const H3 = styled.h3<Props>`
    ${baseStyles};
    font-size: ${FONT_SIZE.H3};
    line-height: 28px;
    font-weight: ${(props: Props) => props.fontWeight || 500};
    margin: 0;
`;

export { H1, H2, H3 };
