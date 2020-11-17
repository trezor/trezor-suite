import styled, { css } from 'styled-components';

import { NEUE_FONT_SIZE, FONT_WEIGHT } from '../../../config/variables';

interface Props {
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
    /* padding-bottom: 10px; */
    line-height: 32px;
    font-weight: normal;
`;

const H2 = styled.h2<Props>`
    ${baseStyles};
    font-size: ${NEUE_FONT_SIZE.H2};
    /* padding-bottom: 10px; */
    line-height: 24px;
    font-weight: normal;
`;

export { H1, H2 };
