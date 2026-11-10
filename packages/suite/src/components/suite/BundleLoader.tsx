import styled from 'styled-components';

import { Spinner } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';

/** `backwards` hides the spinner until the delay is up, so a quick bundle never flashes it. */
const LoaderWrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    animation: ${FADE_IN} 0.2s 0.5s backwards;
`;

export const BundleLoader = () => (
    <LoaderWrapper data-testid="@suite/bundle-loader">
        <Spinner size={48} />
    </LoaderWrapper>
);
