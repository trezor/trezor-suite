import { ReactNode } from 'react';
import { useEvent } from 'react-use';

import styled from 'styled-components';

import {
    Elevation,
    borders,
    mapElevationToBackground,
    negativeSpacings,
    prevElevation,
    spacings,
} from '@trezor/theme';

import { ModalBackdrop } from './ModalBackdrop';
import { ModalButton } from './ModalButton';
import { ModalContext } from './ModalContext';
import { ModalProvider } from './ModalProvider';
import { ModalAlignment, ModalSize, ModalVariant } from './types';
import { mapModalSizeToWidth } from './utils';
import { FrameProps, FramePropsKeys } from '../../utils/frameProps';
import { useScrollShadow } from '../../utils/useScrollShadow';
import { Box } from '../Box/Box';
import { Divider } from '../Divider/Divider';
import { ElevationContext, ElevationUp, useElevation } from '../ElevationContext/ElevationContext';
import { Column, Row } from '../Flex/Flex';
import { IconName } from '../Icon/Icon';
import { IconCircle } from '../IconCircle/IconCircle';
import { IconButton } from '../buttons/IconButton/IconButton';
import { H3 } from '../typography/Heading/Heading';
import { Text } from '../typography/Text/Text';

export const allowedModalFrameProps = ['height'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedModalFrameProps)[number]>;

const MODAL_CONTENT_ID = 'modal-content';
const MODAL_ELEVATION = 0;

const Container = styled.section<{ $elevation: Elevation }>`
    border-radius: ${borders.radii.md};
    transition: background 0.3s;
    background: ${mapElevationToBackground};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    -webkit-app-region: no-drag;
    height: 100%;
    overflow: hidden;
`;

const ScrollContainer = styled.div`
    overflow-y: auto;
    height: 100%;
`;

type ModalProps = AllowedFrameProps & {
    variant?: ModalVariant;
    children?: ReactNode;
    heading?: ReactNode;
    description?: ReactNode;
    bottomContent?: ReactNode;
    onBackClick?: () => void;
    onCancel?: () => void;
    isBackdropCancelable?: boolean;
    alignment?: ModalAlignment;
    size?: ModalSize;
    iconName?: IconName;
    'data-testid'?: string;
};

const InnerModalBase = ({
    children,
    variant,
    size = 'medium',
    heading,
    description,
    bottomContent,
    iconName,
    onBackClick,
    onCancel,
    isBackdropCancelable,
    height,
    'data-testid': dataTest = '@modal',
}: ModalProps) => {
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom } = useScrollShadow();
    const { elevation } = useElevation();

    const hasHeader = onBackClick || onCancel || heading || description;
    const isIconPushedTop = onCancel !== undefined && !heading && !description && !onBackClick;

    useEvent('keydown', (e: KeyboardEvent) => {
        if (isBackdropCancelable && onCancel && e.key === 'Escape') {
            onCancel?.();
        }
    });

    return (
        <Box maxWidth="95%" maxHeight="80vh" width={mapModalSizeToWidth(size)} height={height}>
            <Container $elevation={elevation} data-testid={dataTest} id={MODAL_CONTENT_ID}>
                <Column height="100%">
                    {hasHeader && (
                        <Row
                            padding={{ horizontal: spacings.md, top: spacings.md }}
                            alignItems={description ? 'flex-start' : 'center'}
                            gap={spacings.md}
                            as="header"
                        >
                            <ElevationUp>
                                {onBackClick && (
                                    <IconButton
                                        variant="tertiary"
                                        icon="caretLeft"
                                        data-testid="@modal/back-button"
                                        onClick={onBackClick}
                                        size="small"
                                    />
                                )}

                                {(heading || description) && (
                                    <Column flex="1" overflow="hidden">
                                        {heading && (
                                            <H3 data-testid="@modal/header" ellipsisLineCount={1}>
                                                {heading}
                                            </H3>
                                        )}
                                        {description && (
                                            <Text
                                                variant="tertiary"
                                                typographyStyle="hint"
                                                ellipsisLineCount={2}
                                                as="div"
                                                data-testid="@modal/header-paragraph"
                                            >
                                                {description}
                                            </Text>
                                        )}
                                    </Column>
                                )}

                                {onCancel && (
                                    <IconButton
                                        variant="tertiary"
                                        icon="x"
                                        data-testid="@modal/close-button"
                                        onClick={onCancel}
                                        size="small"
                                        margin={{ left: 'auto' }}
                                    />
                                )}
                            </ElevationUp>
                        </Row>
                    )}
                    <Box position={{ type: 'relative' }} overflow="hidden" flex="1">
                        <ShadowTop />
                        <ScrollContainer onScroll={onScroll} ref={scrollElementRef}>
                            <Column padding={spacings.md}>
                                {iconName && (
                                    <Box
                                        margin={{
                                            bottom: spacings.md,
                                            top: isIconPushedTop ? negativeSpacings.md : 0,
                                        }}
                                    >
                                        <IconCircle name={iconName} size={110} variant={variant} />
                                    </Box>
                                )}
                                <ElevationUp>{children}</ElevationUp>
                            </Column>
                        </ScrollContainer>
                        <ShadowBottom />
                    </Box>
                    {bottomContent && (
                        <>
                            <Divider margin={{}} />
                            <Row
                                padding={spacings.md}
                                gap={spacings.xs}
                                flexWrap="wrap"
                                as="footer"
                            >
                                <ElevationUp>{bottomContent}</ElevationUp>
                            </Row>
                        </>
                    )}
                </Column>
            </Container>
        </Box>
    );
};
const ModalBase = (props: ModalProps) => (
    <ElevationContext baseElevation={prevElevation[MODAL_ELEVATION]}>
        <ModalContext.Provider value={{ variant: props.variant }}>
            <InnerModalBase {...props} />
        </ModalContext.Provider>
    </ElevationContext>
);

const Modal = ({ isBackdropCancelable = true, ...rest }: ModalProps) => {
    const { alignment, onCancel } = rest;

    return (
        <ModalBackdrop onClick={isBackdropCancelable ? onCancel : undefined} alignment={alignment}>
            <ModalBase isBackdropCancelable={isBackdropCancelable} {...rest} />
        </ModalBackdrop>
    );
};

Modal.Button = ModalButton;
Modal.Backdrop = ModalBackdrop;
Modal.Provider = ModalProvider;
Modal.ModalBase = ModalBase;

export { Modal, MODAL_CONTENT_ID };
export type { ModalProps, ModalSize };
