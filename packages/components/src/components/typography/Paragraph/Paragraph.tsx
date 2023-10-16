import { ReactNode, HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { variables } from '../../../config';

export type ParagraphSize = 'normal' | 'small' | 'tiny';

const getLineHeight = (size: PProps['size']) => {
    switch (size) {
        case 'small':
            return '18px';
        case 'tiny':
            return 'normal';
        default:
            return '22px';
    }
};

const getWeight = (size: PProps['weight']) => {
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

const Paragraph = styled.div<PProps>`
    font-size: ${props => P_SIZES[props.size || 'normal']};
    line-height: ${props => getLineHeight(props.size)};
    color: ${({ size, theme }) => (size === 'tiny' ? theme.TYPE_LIGHT_GREY : theme.TYPE_DARK_GREY)};
    padding: 0;
    font-weight: ${({ weight }) => getWeight(weight)};
    ${props =>
        props.textAlign &&
        css`
            text-align: ${props.textAlign};
        `}
`;

interface PProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
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
}: PProps) => (
    <Paragraph className={className} size={size} textAlign={textAlign} weight={weight} {...rest}>
        {children}
    </Paragraph>
);

export type { PProps };
export { P };
