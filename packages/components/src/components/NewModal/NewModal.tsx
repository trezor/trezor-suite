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

import { NewModalBackdrop } from './NewModalBackdrop';
import { NewModalButton } from './NewModalButton';
import { NewModalContext } from './NewModalContext';
import { NewModalProvider } from './NewModalProvider';
import { NewModalAlignment, NewModalSize, NewModalVariant } from './types';
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
import { Paragraph } from '../typography/Paragraph/Paragraph';

export const allowedNewModalFrameProps = ['height'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNewModalFrameProps)[number]>;

const NEW_MODAL_CONTENT_ID = 'modal-content';
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

type NewModalProps = AllowedFrameProps & {
    variant?: NewModalVariant;
    children?: ReactNode;
    heading?: ReactNode;
    description?: ReactNode;
    bottomContent?: ReactNode;
    onBackClick?: () => void;
    onCancel?: () => void;
    isBackdropCancelable?: boolean;
    alignment?: NewModalAlignment;
    size?: NewModalSize;
    iconName?: IconName;
    'data-testid'?: string;
};

const InnerNewModalBase = ({
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
}: NewModalProps) => {
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
            <Container
                $elevation={elevation}
                onClick={e => e.stopPropagation()}
                data-testid={dataTest}
                id={NEW_MODAL_CONTENT_ID}
            >
                <Column height="100%">
                    {hasHeader && (
                        <Row
                            padding={{ horizontal: spacings.md, top: spacings.md }}
                            alignItems="center"
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
                                            <Paragraph
                                                variant="tertiary"
                                                typographyStyle="hint"
                                                ellipsisLineCount={2}
                                                data-testid="@modal/header-paragraph"
                                            >
                                                {description}
                                            </Paragraph>
                                        )}
                                    </Column>
                                )}

                                {onCancel && (
                                    <IconButton
                                        variant="tertiary"
                                        icon="close"
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
const NewModalBase = (props: NewModalProps) => (
    <ElevationContext baseElevation={prevElevation[MODAL_ELEVATION]}>
        <NewModalContext.Provider value={{ variant: props.variant }}>
            <InnerNewModalBase {...props} />
        </NewModalContext.Provider>
    </ElevationContext>
);

const NewModal = ({ isBackdropCancelable = true, ...rest }: NewModalProps) => {
    const { alignment, onCancel } = rest;

    return (
        <NewModalBackdrop
            onClick={isBackdropCancelable ? onCancel : undefined}
            alignment={alignment}
        >
            <NewModalBase isBackdropCancelable={isBackdropCancelable} {...rest} />
        </NewModalBackdrop>
    );
};

NewModal.Button = NewModalButton;
NewModal.Backdrop = NewModalBackdrop;
NewModal.Provider = NewModalProvider;
NewModal.ModalBase = NewModalBase;

export { NewModal, NEW_MODAL_CONTENT_ID };
export type { NewModalProps, NewModalSize };
