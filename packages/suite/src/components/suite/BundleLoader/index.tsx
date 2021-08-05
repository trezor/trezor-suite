import React from 'react';
import styled from 'styled-components';

import { Image } from '@suite-components';
import { FADE_IN } from '@trezor/components/lib/config/animations';

// displaying of a loader is delayed to avoid displaying to users with fast internet
const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    animation: ${FADE_IN} 0.2s 0.5s;
`;

const BundleLoader = () => (
    <LoaderWrapper data-test="@suite/bundle-loader">
        <Image width={64} height={64} image="SPINNER" />
    </LoaderWrapper>
);

export default BundleLoader;
