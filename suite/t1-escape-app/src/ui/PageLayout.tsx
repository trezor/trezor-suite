import type { ReactNode } from 'react';

import styled from 'styled-components';

import { Column, H1, Paragraph } from '@trezor/components';

const Page = styled.main`
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 16px 96px;
`;

type PageLayoutProps = {
    children: ReactNode;
};

export const PageLayout = ({ children }: PageLayoutProps) => (
    <Page>
        <Column gap={24}>
            <Column gap={4}>
                <H1 typographyStyle="headline-md">Old Trezor One migration</H1>
                <Paragraph priority="secondary">
                    Move bitcoin off a Trezor One with firmware 1.3.6 to 1.6.3
                </Paragraph>
            </Column>
            {children}
        </Column>
    </Page>
);
