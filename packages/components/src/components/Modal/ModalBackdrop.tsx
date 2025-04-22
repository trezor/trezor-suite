import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import FocusLock from 'react-focus-lock';

import styled from 'styled-components';

import { ZIndexValues, spacings, zIndices } from '@trezor/theme';

import { useModalTarget } from './ModalProvider';
import { ModalAlignment } from './types';
import { mapAlignmentToAlignItems, mapAlignmentToJustifyContent } from './utils';
import { Padding } from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Column } from '../Flex/Flex';

export type ModalBackdropProps = {
    onClick?: () => void;
    children?: ReactNode;
    alignment?: ModalAlignment;
    padding?: Padding;
    zIndex?: ZIndexValues;
};

const Backdrop = styled.div`
    backdrop-filter: blur(5px);
    background: rgb(0 0 0 / 30%);
    height: 100%;
`;

const InnerWrapper = styled.div`
    display: contents;
`;

export const ModalBackdrop = ({
    onClick,
    children,
    alignment = { x: 'center', y: 'center' },
    padding = spacings.xs,
    zIndex = zIndices.modal,
}: ModalBackdropProps) => {
    const modalTarget = useModalTarget();

    const backdrop = (
        // eslint-disable-next-line jsx-a11y/no-autofocus
        <FocusLock autoFocus={false}>
            <Box position={{ type: 'absolute', inset: 0 }} zIndex={zIndex}>
                <Backdrop onClick={onClick}>
                    <Box padding={padding} height="100%">
                        <Column
                            alignItems={mapAlignmentToAlignItems(alignment)}
                            justifyContent={mapAlignmentToJustifyContent(alignment)}
                            gap={spacings.md}
                            height="100%"
                            overflow="scroll"
                        >
                            <InnerWrapper onClick={e => e.stopPropagation()}>
                                {children}
                            </InnerWrapper>
                        </Column>
                    </Box>
                </Backdrop>
            </Box>
        </FocusLock>
    );

    return modalTarget ? createPortal(backdrop, modalTarget) : backdrop;
};
