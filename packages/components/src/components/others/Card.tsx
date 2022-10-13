import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div<{ paddingSize: string }>`
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    padding: ${props => props.paddingSize};
    background: ${props => props.theme.BG_WHITE};
`;

const getPaddingSize = (
    largePadding?: boolean,
    noPadding?: boolean,
    noVerticalPadding?: boolean,
) => {
    if (noPadding) return '0px';
    if (noVerticalPadding) {
        if (largePadding) return `0px 26px`;
        return `0px 20px`;
    }
    if (largePadding) return '26px';
    return '20px';
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    largePadding?: boolean;
    noPadding?: boolean;
    noVerticalPadding?: boolean;
    customPadding?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ children, largePadding, noPadding, noVerticalPadding, customPadding, ...rest }, ref) => (
        <Wrapper
            ref={ref}
            paddingSize={
                customPadding || getPaddingSize(largePadding, noPadding, noVerticalPadding)
            }
            {...rest}
        >
            {children}
        </Wrapper>
    ),
);
