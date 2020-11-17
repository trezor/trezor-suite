import React from 'react';
import styled from 'styled-components';
import { colors } from '../../../config';

const Wrapper = styled.div<{ paddingSize: string }>`
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    padding: ${props => props.paddingSize};
    background: ${props => props.theme.BG_WHITE};
`;

const getPaddingSize = (
    largePadding?: boolean,
    noPadding?: boolean,
    noVerticalPadding?: boolean
) => {
    if (noPadding) return '0px';
    if (noVerticalPadding) {
        if (largePadding) return `0px 26px`;
        return `0px 20px`;
    }
    if (largePadding) return '26px';
    return '20px';
};

export interface Props {
    children?: React.ReactNode;
    largePadding?: boolean;
    noPadding?: boolean;
    noVerticalPadding?: boolean;
}

const Card = ({ children, largePadding, noPadding, noVerticalPadding, ...rest }: Props) => (
    <Wrapper paddingSize={getPaddingSize(largePadding, noPadding, noVerticalPadding)} {...rest}>
        {children}
    </Wrapper>
);

export { Card, Props as CardProps };
