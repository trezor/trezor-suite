// Unfortunately, design is constantly changing and @trezor/components do not comply at the moment.
// So I am creating this proxy typography which matches current design and makes future refactoring relatively easy.

import React from 'react';
import styled, { css } from 'styled-components';

import { P as OrigP, H1 as OrigH1, H2 as OrigH2, variables } from '@trezor/components';

const { FONT_WEIGHT } = variables;

interface Props {
    children: React.ReactNode;
}

const StyledP = styled(OrigP)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const P = (props: Props) => (
    <StyledP size="small" {...props}>
        {props.children}
    </StyledP>
);

export const H1 = (props: Props) => <OrigH1 {...props}>{props.children}</OrigH1>;

const StyledH2 = styled(OrigH2)<{ isGreen?: boolean }>`
    font-weight: ${FONT_WEIGHT.MEDIUM};
    ${props =>
        props.isGreen &&
        css`
            color: ${({ theme }) => theme.TYPE_GREEN};
        `};
`;

export const H2 = (props: Props & { isGreen?: boolean }) => <StyledH2 {...props} />;
