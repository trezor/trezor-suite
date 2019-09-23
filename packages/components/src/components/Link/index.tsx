import React from 'react';
import styled, { css } from 'styled-components';

import colors from '../../config/colors';

const A = styled.a<Props>`
    text-decoration: none;
    cursor: pointer;
    ${props =>
        props.isGray &&
        css`
            color: ${colors.TEXT_SECONDARY};
            &:visited,
            &:active,
            &:hover {
                text-decoration: underline;
                color: ${colors.TEXT_SECONDARY};
            }
        `}
    ${props =>
        props.isGreen &&
        css`
            color: ${colors.GREEN_PRIMARY};
            &:visited,
            &:active,
            &:hover {
                text-decoration: underline;
                color: ${colors.GREEN_PRIMARY};
            }
        `}
    ${props =>
        props.hasNoStyle &&
        css`
            color: inherit;
            &:visited,
            &:active,
            &:hover {
                text-decoration: none;
                color: inherit;
            }
        `}
`;

interface Props {
    isGray?: boolean;
    isGreen?: boolean;
    hasNoStyle?: boolean;
    href?: string;
    to?: any;
    target?: string;
    onClick?: (event: React.MouseEvent<any>) => void;
    children?: React.ReactNode;
    className?: string;
}

const Link = (props: Props) => (
    <A href={props.href} target={props.target || '_blank'} rel="noreferrer noopener" {...props}>
        {props.children}
    </A>
);

export { Link, Props as LinkProps };
