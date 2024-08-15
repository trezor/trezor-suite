import { ReactNode } from 'react';
import styled from 'styled-components';
import FocusLock from 'react-focus-lock';
import { zIndices, spacings } from '@trezor/theme';
import { createPortal } from 'react-dom';

import { NewModalAlignment } from './types';
import { mapAlignmentToAlignItems, mapAlignmentToJustifyContent } from './utils';
import { useModalTarget } from './NewModalProvider';

export type NewModalBackdropProps = {
    onClick?: () => void;
    children?: ReactNode;
    alignment?: NewModalAlignment;
    padding?: number;
};

const Wrapper = styled.div<{ $alignment: NewModalAlignment; $padding: number }>`
    position: absolute;
    z-index: ${zIndices.modal};
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: ${({ $padding }) => $padding}px;
    overflow: auto;
    backdrop-filter: blur(5px);
    background: rgb(0 0 0 / 30%);
    align-items: ${({ $alignment }) => mapAlignmentToAlignItems($alignment)};
    justify-content: ${({ $alignment }) => mapAlignmentToJustifyContent($alignment)};
`;

export const NewModalBackdrop = ({
    onClick,
    children,
    alignment = { x: 'center', y: 'center' },
    padding = spacings.xs,
}: NewModalBackdropProps) => {
    const modalTarget = useModalTarget();

    const backdrop = (
        <FocusLock autoFocus={false}>
            <Wrapper onClick={onClick} $alignment={alignment} $padding={padding}>
                {children}
            </Wrapper>
        </FocusLock>
    );

    return modalTarget ? createPortal(backdrop, modalTarget) : backdrop;
};
