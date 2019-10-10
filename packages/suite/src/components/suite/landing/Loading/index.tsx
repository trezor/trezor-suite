import React from 'react';
import styled from 'styled-components';
import { Loader } from '@trezor/components';
import { SuiteLayout } from '@suite-components';

const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const Loading = () => (
    <SuiteLayout isLanding>
        <LoaderWrapper>
            <Loader text="Loading" size={100} strokeWidth={1} />
        </LoaderWrapper>
    </SuiteLayout>
);

export default Loading;
