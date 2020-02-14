import React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '../Icon';
import colors from '../../config/colors';
import { FONT_SIZE } from '../../config/variables';
import { ParagraphSize } from '../../support/types';

const P_SIZES = {
    normal: FONT_SIZE.NORMAL,
    small: FONT_SIZE.SMALL,
    tiny: FONT_SIZE.TINY,
};

const A = styled.a<Props>`
    font-size: ${props => (props.size ? P_SIZES[props.size] : 'inherit')};
    text-decoration: none;
    cursor: pointer;
    color: ${colors.GREENER};
    font-weight: 600;
    display: flex;

    &:hover {
        text-decoration: underline;
    }

    ${props =>
        props.variant === 'nostyle' &&
        css`
            color: inherit;
            font-weight: inherit;
            &:visited,
            &:active,
            &:hover {
                text-decoration: none;
                color: inherit;
            }
        `}
`;

interface Props {
    href?: string;
    to?: any;
    target?: string;
    size?: ParagraphSize;
    onClick?: (event: React.MouseEvent<any>) => void;
    children?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'nostyle';
}

const Link = (props: Props) => (
    <A href={props.href} target={props.target || '_blank'} rel="noreferrer noopener" {...props}>
        {props.children}
        {props.href && <Icon size={props.size ? P_SIZES[props.size] : 20} icon="EXTERNAL_LINK" />}
    </A>
);

export { Link, Props as LinkProps };
