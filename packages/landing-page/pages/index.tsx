import React from 'react';
import styled from 'styled-components';
import { H1, Input, P } from '@trezor/components';

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    justify-content: center;
`;

const Content = styled.div`
    max-width: 500px;
`;

const Index = () => (
    <Layout>
        <Content>
            <H1>Landing page</H1>
            <P>
                Even though using "lorem ipsum" often arouses curiosity due to its resemblance to
                classical Latin, it is not intended to have meaning. Where text is visible in a
                document, people tend to focus on the textual content rather than upon overall
                presentation, so publishers use lorem ipsum when displaying a typeface or design in
                order to direct the focus to presentation. "Lorem ipsum" also approximates a typical
                distribution of letters in English.
            </P>
            <Input type="text" />
        </Content>
    </Layout>
);

export default Index;
