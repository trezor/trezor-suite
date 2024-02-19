import styled from 'styled-components';

import { Spinner } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';

// displaying of a loader is delayed to avoid displaying to users with fast internet
const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    animation: ${FADE_IN} 0.2s 0.5s;
`;

export const BundleLoader = () => (
    <LoaderWrapper data-test-id="@suite/bundle-loader">
        <Spinner size={64} isGrey={false} />
    </LoaderWrapper>
);
