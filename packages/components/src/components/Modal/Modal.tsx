import { type ReactNode } from 'react';
import { useEvent } from 'react-use';

import styled from 'styled-components';

import { CaretLeftIcon, XIcon } from '@trezor/icons';

import { ModalBackdrop } from './ModalBackdrop';
import { ModalButton } from './ModalButton';
import { ModalContext } from './ModalContext';
import { ModalProvider } from './ModalProvider';
import { type ModalAlignment, type ModalIntent, type ModalWidth } from './types';
import { type FrameProps, type FramePropsKeys, type Padding } from '../../utils/frameProps';
import { useScrollShadow } from '../../utils/useScrollShadow';
import { Box } from '../Box/Box';
import { Divider } from '../Divider/Divider';
import { Column, Row } from '../Flex/Flex';
import { type IconComponent } from '../Icon/Icon';
import { IconCircle } from '../IconCircle/IconCircle';
import { IconButton } from '../buttons/IconButton/IconButton';
import { H3 } from '../typography/Heading/Heading';
import { Text } from '../typography/Text/Text';

export const allowedModalFrameProps = ['height', 'maxHeight'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedModalFrameProps)[number]>;

const Container = styled.section`
    border-radius: 16px;
    transition: background 0.3s;
    background: ${({ theme }) => theme.surfaceFillModal};
    outline: 1px solid ${({ theme }) => theme.surfaceBorderModal};
    box-shadow: ${({ theme }) => theme.surfaceShadowModal};
    -webkit-app-region: no-drag;
    height: 100%;
    overflow: hidden;
`;

const ScrollContainer = styled.div`
    overflow-y: auto;
    height: 100%;
`;

type ModalProps = AllowedFrameProps & {
    intent?: ModalIntent;
    children?: ReactNode;
    heading?: ReactNode;
    description?: ReactNode;
    bottomContent?: ReactNode;
    onBackClick?: () => void;
    onCancel?: () => void;
    backButtonTooltip?: ReactNode;
    closeButtonTooltip?: ReactNode;
    isBackdropCancelable?: boolean;
    alignment?: ModalAlignment;
    width?: ModalWidth;
    icon?: IconComponent;
    'data-testid'?: string;
    padding?: Padding;
    shadowBottom?: boolean;
};

const ModalBase = ({
    children,
    intent = 'brand',
    width = 680,
    heading,
    description,
    bottomContent,
    icon,
    onBackClick,
    onCancel,
    backButtonTooltip,
    closeButtonTooltip,
    isBackdropCancelable,
    height,
    maxHeight = '85vh',
    'data-testid': dataTest = '@modal',
    padding,
    shadowBottom = true,
}: ModalProps) => {
    const { scrollElementRef, onScroll, ShadowTop, ShadowBottom } = useScrollShadow({
        backgroundColor: 'surfaceFillModal',
    });

    const hasHeader = onBackClick || onCancel || heading || description;
    const isIconPushedTop = onCancel !== undefined && !heading && !description && !onBackClick;

    useEvent('keydown', (e: KeyboardEvent) => {
        if (isBackdropCancelable && onCancel && e.key === 'Escape') {
            onCancel?.();
        }
    });

    return (
        <ModalContext.Provider value={{ intent }}>
            <Box maxWidth="95%" maxHeight={maxHeight} width={width} height={height}>
                <Container data-testid={dataTest}>
                    <Column height="100%">
                        {hasHeader && (
                            <Row
                                padding={{ horizontal: 16, top: 16 }}
                                alignItems={description ? 'flex-start' : 'center'}
                                gap={16}
                                as="header"
                            >
                                {onBackClick && (
                                    <IconButton
                                        intent="neutral"
                                        priority="secondary"
                                        icon={CaretLeftIcon}
                                        data-testid="@modal/back-button"
                                        onClick={onBackClick}
                                        tooltip={
                                            backButtonTooltip
                                                ? { content: backButtonTooltip }
                                                : { isActive: false }
                                        }
                                    />
                                )}

                                {(heading || description) && (
                                    <Column flex="1" overflow="hidden">
                                        {heading && <H3 data-testid="@modal/header">{heading}</H3>}
                                        {description && (
                                            <Text
                                                intent="neutral"
                                                priority="secondary"
                                                typographyStyle="body-sm"
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
                                        intent="neutral"
                                        priority="secondary"
                                        icon={XIcon}
                                        data-testid="@modal/close-button"
                                        onClick={onCancel}
                                        margin={{ left: 'auto' }}
                                        tooltip={
                                            closeButtonTooltip
                                                ? { content: closeButtonTooltip }
                                                : { isActive: false }
                                        }
                                    />
                                )}
                            </Row>
                        )}
                        <Box position={{ type: 'relative' }} overflow="hidden" flex="1">
                            <ShadowTop />
                            <ScrollContainer onScroll={onScroll} ref={scrollElementRef}>
                                <Column padding={padding ? padding : 16}>
                                    {icon && (
                                        <Box
                                            margin={{
                                                bottom: 16,
                                                top: isIconPushedTop ? -16 : 0,
                                            }}
                                        >
                                            <IconCircle icon={icon} size={112} intent={intent} />
                                        </Box>
                                    )}
                                    {children}
                                </Column>
                            </ScrollContainer>
                            {shadowBottom && <ShadowBottom />}
                        </Box>
                        {bottomContent && (
                            <>
                                <Divider margin={{}} />
                                <Row padding={16} gap={8} flexWrap="wrap" as="footer">
                                    {bottomContent}
                                </Row>
                            </>
                        )}
                    </Column>
                </Container>
            </Box>
        </ModalContext.Provider>
    );
};

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

export { Modal };
export type { ModalProps, ModalWidth };
