import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import FocusLock from 'react-focus-lock';

import styled from 'styled-components';

import { spacings, zIndices } from '@trezor/theme';

import { useModalTarget } from './NewModalProvider';
import { NewModalAlignment } from './types';
import { mapAlignmentToAlignItems, mapAlignmentToJustifyContent } from './utils';
import { Box } from '../Box/Box';
import { Column } from '../Flex/Flex';

export type NewModalBackdropProps = {
    onClick?: () => void;
    children?: ReactNode;
    alignment?: NewModalAlignment;
    padding?: number;
};

const Wrapper = styled.div<{ $padding: number }>`
    padding: ${({ $padding }) => $padding}px;
    backdrop-filter: blur(5px);
    background: rgb(0 0 0 / 30%);
    height: 100%;
`;

export const NewModalBackdrop = ({
    onClick,
    children,
    alignment = { x: 'center', y: 'center' },
    padding = spacings.xs,
}: NewModalBackdropProps) => {
    const modalTarget = useModalTarget();

    const backdrop = (
        // eslint-disable-next-line jsx-a11y/no-autofocus
        <FocusLock autoFocus={false}>
            <Box position={{ type: 'absolute', inset: 0 }} zIndex={zIndices.modal} overflow="auto">
                <Wrapper onClick={onClick} $padding={padding}>
                    <Column
                        alignItems={mapAlignmentToAlignItems(alignment)}
                        justifyContent={mapAlignmentToJustifyContent(alignment)}
                        gap={spacings.md}
                        height="100%"
                    >
                        {children}
                    </Column>
                </Wrapper>
            </Box>
        </FocusLock>
    );

    return modalTarget ? createPortal(backdrop, modalTarget) : backdrop;
};
