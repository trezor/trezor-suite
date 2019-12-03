import React from 'react';
import styled from 'styled-components';

import colors from '../../config/colors';

const A = styled.a<Props>`
    text-decoration: none;
    cursor: pointer;
    color: ${colors.GREENER};
    font-size: inherit;
    font-weight: 600;

    &:hover {
        text-decoration: underline;
    }
`;

interface Props {
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

export { Link };
