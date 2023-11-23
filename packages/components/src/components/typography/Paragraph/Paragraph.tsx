import React from 'react';
import styled from 'styled-components';
import { typography, TypographyStyle } from '@trezor/theme';

export type ParagraphProps = {
    type?: TypographyStyle;
    className?: string; // Used for color, margins etc. while typography properties should be set via type prop.
    'data-test'?: string;
    children: React.ReactNode;
};

const P = styled.div<{ type: TypographyStyle }>`
    ${({ type }) => typography[type]}
`;

export const Paragraph = ({
    className,
    type = 'body',
    'data-test': dataTest,
    children,
}: ParagraphProps) => (
    <P className={className} type={type} data-test={dataTest}>
        {children}
    </P>
);
