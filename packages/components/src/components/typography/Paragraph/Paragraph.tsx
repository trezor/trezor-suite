import React from 'react';
import styled from 'styled-components';
import { typography, TypographyStyle } from '@trezor/theme';

export type ParagraphProps = {
    typographyStyle?: TypographyStyle;
    className?: string; // Used for color, margins etc. while typography properties should be set via type prop.
    'data-test'?: string;
    children: React.ReactNode;
};

const P = styled.div<{ $typographyStyle: TypographyStyle }>`
    ${({ $typographyStyle }) => typography[$typographyStyle]}
`;

export const Paragraph = ({
    className,
    typographyStyle = 'body',
    'data-test': dataTest,
    children,
}: ParagraphProps) => (
    <P className={className} $typographyStyle={typographyStyle} data-test={dataTest}>
        {children}
    </P>
);
