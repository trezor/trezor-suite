import React from 'react';
import styled, { css } from 'styled-components';
import { variables } from '../../../config';
import { ParagraphSize } from '../../../support/types';

const getLineHeight = (size: Props['size']) => {
    switch (size) {
        case 'small':
            return '18px';
        case 'tiny':
            return 'normal';
        default:
            return '22px';
    }
};

const getWeight = (size: Props['weight']) => {
    switch (size) {
        case 'normal':
            return variables.FONT_WEIGHT.REGULAR;
        case 'medium':
            return variables.FONT_WEIGHT.MEDIUM;
        case 'bold':
            return variables.FONT_WEIGHT.DEMI_BOLD;
        default:
            return variables.FONT_WEIGHT.REGULAR;
    }
};

const P_SIZES: { [key: string]: string } = {
    normal: variables.FONT_SIZE.NORMAL,
    small: variables.FONT_SIZE.SMALL,
    tiny: variables.FONT_SIZE.TINY,
};

const Paragraph = styled.div<Props>`
    font-size: ${props => P_SIZES[props.size || 'normal']};
    line-height: ${props => getLineHeight(props.size)};
    color: ${props =>
        props.size === 'tiny' ? props.theme.TYPE_LIGHT_GREY : props.theme.TYPE_DARK_GREY};
    padding: 0;
    font-weight: ${({ weight }) => getWeight(weight)};
    ${props =>
        props.textAlign &&
        css`
            text-align: ${props.textAlign};
        `}
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    size?: ParagraphSize;
    weight?: 'normal' | 'bold' | 'medium';
    textAlign?: string;
}

const P = ({
    children,
    className,
    size = 'normal',
    weight = 'normal',
    textAlign,
    ...rest
}: Props) => (
    <Paragraph className={className} size={size} textAlign={textAlign} weight={weight} {...rest}>
        {children}
    </Paragraph>
);

export type { Props as PProps };
export { P };
