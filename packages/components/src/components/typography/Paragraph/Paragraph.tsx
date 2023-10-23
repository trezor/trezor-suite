import React from 'react';
import styled from 'styled-components';
import { typography, TypographyStyle } from '@trezor/theme';

export type PProps = {
    type?: TypographyStyle;
    children: React.ReactNode;
};

const Paragraph = styled.div<{ type: TypographyStyle }>`
    ${({ type }) => typography[type]}
`;

export const P = ({ type = 'body', children }: PProps) => (
    <Paragraph type={type}>{children}</Paragraph>
);
