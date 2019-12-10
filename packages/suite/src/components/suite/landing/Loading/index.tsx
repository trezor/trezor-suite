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
        <LoaderWrapper>
            <Loader text="Loading" size={100} strokeWidth={1} />
        </LoaderWrapper>
);

export default Loading;
