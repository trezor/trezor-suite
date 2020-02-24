import React from 'react';
import styled from 'styled-components';
import { H2 } from '@trezor/components';
import { SuiteLayout, Translation } from '@suite-components';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 16px 32px 32px 32px;
    max-width: 1024px;
`;

export default (_props: Props) => {
    return (
        <SuiteLayout title="Notifications">
            <Wrapper>
                <H2>Notifications</H2>
            </Wrapper>
        </SuiteLayout>
    );
};
