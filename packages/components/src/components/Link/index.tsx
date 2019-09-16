import React, { FunctionComponent } from 'react';
import styled, { css } from 'styled-components';

import PropTypes from 'prop-types';
import colors from '../../config/colors';
import { BooleanLiteral } from '@babel/types';

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

const Link: FunctionComponent<Props> = props => (
    <A href={props.href} target={props.target || '_blank'} rel="noreferrer noopener" {...props}>
        {props.children}
    </A>
);

export { Link, Props as LinkProps };
