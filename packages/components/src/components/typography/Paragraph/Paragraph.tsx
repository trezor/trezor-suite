import React from 'react';
import styled from 'styled-components';
import { typography, TypographyStyle } from '@trezor/theme';

export type ParagraphProps = {
    type?: TypographyStyle;
    children: React.ReactNode;
};

const P = styled.div<{ type: TypographyStyle }>`
    ${({ type }) => typography[type]}
`;

export const Paragraph = ({ type = 'body', children }: ParagraphProps) => (
    <P type={type}>{children}</P>
);
