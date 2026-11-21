import styled from 'styled-components';

import { ModalBackdrop } from './ModalBackdrop';
import { FADE_IN } from '../../config/animations';
import { Spinner } from '../loaders/Spinner/Spinner';

/**
 * The fade starts half a second in, and `backwards` holds the spinner invisible until then, so a
 * chunk that arrives quickly never flashes a placeholder. Without that fill mode the element would
 * render fully opaque for the whole delay, which is the opposite of what the delay is for.
 */
const DelayedFadeIn = styled.div`
    animation: ${FADE_IN} 0.2s 0.5s backwards;
`;

/**
 * Stands in for a modal while its code chunk loads, so the backdrop appears in the same commit that
 * the user's click opens the modal, rather than the screen staying untouched until the chunk lands.
 */
export const ModalSkeleton = () => (
    <ModalBackdrop data-testid="@modal/skeleton">
        <DelayedFadeIn>
            <Spinner size={48} />
        </DelayedFadeIn>
    </ModalBackdrop>
);
