import styled from 'styled-components';

import { ModalBackdrop } from './ModalBackdrop';
import { FADE_IN } from '../../config/animations';
import { Spinner } from '../loaders/Spinner/Spinner';

/** `backwards` hides the spinner until the delay is up, so a quick chunk never flashes it. */
const DelayedFadeIn = styled.div`
    animation: ${FADE_IN} 0.2s 0.5s backwards;
`;

/** Stands in for a modal while its chunk loads, so the backdrop appears on the opening click. */
export const ModalSkeleton = () => (
    <ModalBackdrop data-testid="@modal/skeleton">
        <DelayedFadeIn>
            <Spinner size={48} />
        </DelayedFadeIn>
    </ModalBackdrop>
);
