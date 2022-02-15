import styled, { css } from 'styled-components';
import React from 'react';
import { FONT_SIZE } from '../../../config/variables';
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

const P_SIZES: { [key: string]: string } = {
    normal: FONT_SIZE.NORMAL,
    small: FONT_SIZE.SMALL,
    tiny: FONT_SIZE.TINY,
};

const Paragraph = styled.div<Props>`
    font-size: ${props => P_SIZES[props.size || 'normal']};
    line-height: ${props => getLineHeight(props.size)};
    color: ${props =>
        props.size === 'tiny' ? props.theme.TYPE_LIGHT_GREY : props.theme.TYPE_DARK_GREY};
    padding: 0;
    font-weight: ${props => (props.weight === 'normal' ? 'normal' : 600)};
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
    weight?: 'normal' | 'bold';
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
