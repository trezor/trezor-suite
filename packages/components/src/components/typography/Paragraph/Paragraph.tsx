import React from 'react';
import styled from 'styled-components';
import { typography, TypographyStyle } from '@trezor/theme';

export type ParagraphProps = {
    type?: TypographyStyle;
    'data-test'?: string;
    children: React.ReactNode;
};

const P = styled.div<{ type: TypographyStyle }>`
    ${({ type }) => typography[type]}
`;

export const Paragraph = ({ type = 'body', 'data-test': dataTest, children }: ParagraphProps) => (
    <P type={type} data-test={dataTest}>
        {children}
    </P>
);
