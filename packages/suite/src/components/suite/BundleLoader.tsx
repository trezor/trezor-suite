import styled from 'styled-components';

import { Spinner } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';

/**
 * The fade starts half a second in, and `backwards` holds the spinner invisible until then, so a
 * bundle that arrives quickly never flashes a loader. Without that fill mode the element would
 * render fully opaque for the whole delay, which is the opposite of what the delay is for.
 */
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
