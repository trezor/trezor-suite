import styled, { css } from 'styled-components/native';
import PropTypes from 'prop-types';

import React from 'react';
import { FONT_SIZE_NATIVE, LINE_HEIGHT } from '../../config/variables';
import colors from '../../config/colors';

const P_SIZES: { [key: string]: number } = {
    small: FONT_SIZE_NATIVE.SMALL,
    medium: FONT_SIZE_NATIVE.BASE,
    large: FONT_SIZE_NATIVE.BIG,
    xlarge: FONT_SIZE_NATIVE.BIGGER,
};

const Paragraph = styled.View<Props>`
    flex: 1;
`;

const StyledText = styled.Text<ParagraphProps>`
    font-size: ${props => props.fontSize};
    line-height: ${props => props.fontSize + props.fontSize / 2};
    color: ${colors.TEXT_SECONDARY};

    ${props =>
        props.textAlign &&
        css`
            text-align: ${props.textAlign};
        `}
`;

interface ParagraphProps extends Props {
    fontSize: number;
}

interface Props {
    children: React.ReactNode;
    className?: string;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    textAlign?: string;
}

const P = ({ children, className, size = 'medium', textAlign, ...rest }: Props) => (
    <Paragraph className={className} {...rest}>
        <StyledText textAlign={textAlign} fontSize={P_SIZES[size]}>
            {children}
        </StyledText>
    </Paragraph>
);

P.propType = {
    className: PropTypes.string,
    children: PropTypes.node,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
    textAlign: PropTypes.oneOf(['left', 'center', 'right', 'justify', 'inherit', 'initial']),
};

export { P, Props as ParagraphProps };
