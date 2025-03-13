import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import FocusLock from 'react-focus-lock';

import styled from 'styled-components';

import { spacings, zIndices } from '@trezor/theme';

import { useModalTarget } from './NewModalProvider';
import { NewModalAlignment } from './types';
import { mapAlignmentToAlignItems, mapAlignmentToJustifyContent } from './utils';
import { Margin } from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Column } from '../Flex/Flex';

export type NewModalBackdropProps = {
    onClick?: () => void;
    children?: ReactNode;
    alignment?: NewModalAlignment;
    margin?: Margin;
};

const Wrapper = styled.div`
    backdrop-filter: blur(5px);
    background: rgb(0 0 0 / 30%);
    height: 100vh;
    overflow: auto;
`;

export const NewModalBackdrop = ({
    onClick,
    children,
    alignment = { x: 'center', y: 'center' },
    margin = spacings.xs,
}: NewModalBackdropProps) => {
    const modalTarget = useModalTarget();

    const backdrop = (
        // eslint-disable-next-line jsx-a11y/no-autofocus
        <FocusLock autoFocus={false}>
            <Box position={{ type: 'absolute', inset: 0 }} zIndex={zIndices.modal} overflow="auto">
                <Wrapper onClick={onClick}>
                    <Column
                        alignItems={mapAlignmentToAlignItems(alignment)}
                        justifyContent={mapAlignmentToJustifyContent(alignment)}
                        gap={spacings.md}
                        margin={margin}
                    >
                        {children}
                    </Column>
                </Wrapper>
            </Box>
        </FocusLock>
    );

    return modalTarget ? createPortal(backdrop, modalTarget) : backdrop;
};
