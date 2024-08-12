import React from 'react';
import styled from 'styled-components';
import { typography, TypographyStyle } from '@trezor/theme';

export type ParagraphProps = {
    typographyStyle?: TypographyStyle;
    className?: string; // Used for color, margins etc. while typography properties should be set via type prop.
    'data-testid'?: string;
    children: React.ReactNode;
};

const P = styled.div<{ $typographyStyle: TypographyStyle }>`
    ${({ $typographyStyle }) => typography[$typographyStyle]}
`;

// @TODO should be implemented with Text component: <Text as="p">...</Text>
export const Paragraph = ({
    className,
    typographyStyle = 'body',
    'data-testid': dataTest,
    children,
}: ParagraphProps) => (
    <P className={className} $typographyStyle={typographyStyle} data-testid={dataTest}>
        {children}
    </P>
);
