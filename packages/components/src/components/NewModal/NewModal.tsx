import { ReactNode } from 'react';
import styled from 'styled-components';
import { useEvent } from 'react-use';
import {
    borders,
    Elevation,
    mapElevationToBackground,
    mapElevationToBackgroundToken,
    spacingsPx,
} from '@trezor/theme';

import { IconButton } from '../buttons/IconButton/IconButton';
import { Text } from '../typography/Text/Text';
import { H3 } from '../typography/Heading/Heading';
import { ElevationContext } from '../ElevationContext/ElevationContext';
import { useScrollShadow } from '../../utils/useScrollShadow';
import { NewModalButton } from './NewModalButton';
import { NewModalContext } from './NewModalContext';
import { NewModalBackdrop } from './NewModalBackdrop';
import { NewModalProvider } from './NewModalProvider';
import type { NewModalVariant, NewModalSize, NewModalAlignment } from './types';
import {
    mapVariantToIconBackground,
    mapVariantToIconBorderColor,
    mapModalSizeToWidth,
} from './utils';
import { Icon, IconName } from '../Icon/Icon';

const NEW_MODAL_CONTENT_ID = 'modal-content';
const MODAL_ELEVATION = 0;
const ICON_SIZE = 40;

const Container = styled.div<{ $elevation: Elevation; $size: NewModalSize }>`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: ${borders.radii.md};
    transition: background 0.3s;
    max-width: 95%;
    min-width: 305px;
    max-height: 80vh;
    width: ${({ $size }) => mapModalSizeToWidth($size)}px;
    overflow: hidden;
    background: ${mapElevationToBackground};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
`;

const Header = styled.header`
    display: flex;
    align-items: center;
    word-break: break-word;
    padding: ${spacingsPx.md};
    padding-bottom: 0;
    gap: ${spacingsPx.md};
`;

const HeadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Heading = styled(H3)`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;

const ScrollContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    overflow-y: auto;
`;

const Body = styled.div`
    padding: ${spacingsPx.md};
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const Footer = styled.footer`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.xs};
    padding: ${spacingsPx.md};
    border-top: 1px solid ${({ theme }) => theme.borderElevation0};
`;

const IconWrapper = styled.div<{ $variant: NewModalVariant; $size: number }>`
    width: ${({ $size }) => $size}px;
    background: ${({ theme, $variant }) => mapVariantToIconBackground({ theme, $variant })};
    padding: ${spacingsPx.lg};
    border-radius: ${borders.radii.full};
    border: ${spacingsPx.sm} solid
        ${({ theme, $variant }) => mapVariantToIconBorderColor({ theme, $variant })};
    box-sizing: content-box;
    margin-bottom: ${spacingsPx.md};
`;

interface NewModalProps {
    children?: ReactNode;
    variant?: NewModalVariant;
    heading?: ReactNode;
    description?: ReactNode;
    bottomContent?: ReactNode;
    onBackClick?: () => void;
    onCancel?: () => void;
    icon?: IconName;
    alignment?: NewModalAlignment;
    size?: NewModalSize;
    'data-test'?: string;
}

const NewModalBase = ({
    children,
    variant = 'primary',
    size = 'medium',
    heading,
    description,
    bottomContent,
    icon,
    onBackClick,
    onCancel,
    'data-test': dataTest = '@modal',
}: NewModalProps) => {
    const { scrollElementRef, onScroll, ShadowContainer, ShadowTop, ShadowBottom } =
        useScrollShadow();
    const modalBackgroundColor = mapElevationToBackgroundToken({ $elevation: MODAL_ELEVATION });

    useEvent('keydown', (e: KeyboardEvent) => {
        if (onCancel && e.key === 'Escape') {
            onCancel?.();
        }
    });

    return (
        <ElevationContext baseElevation={MODAL_ELEVATION}>
            <NewModalContext.Provider value={{ variant }}>
                <Container
                    $elevation={MODAL_ELEVATION}
                    $size={size}
                    onClick={e => e.stopPropagation()}
                    data-testid={dataTest}
                >
                    <Header>
                        {onBackClick && (
                            <IconButton
                                variant="tertiary"
                                icon="chevronLeft"
                                data-testid="@modal/back-button"
                                onClick={onBackClick}
                                size="small"
                            />
                        )}

                        <HeadingContainer>
                            {heading && <Heading>{heading}</Heading>}
                            {description && (
                                <Text variant="tertiary" typographyStyle="hint">
                                    {description}
                                </Text>
                            )}
                        </HeadingContainer>

                        {onCancel && (
                            <IconButton
                                variant="tertiary"
                                icon="close"
                                data-testid="@modal/close-button"
                                onClick={onCancel}
                                size="small"
                            />
                        )}
                    </Header>
                    <ShadowContainer>
                        <ShadowTop backgroundColor={modalBackgroundColor} />
                        <ScrollContainer onScroll={onScroll} ref={scrollElementRef}>
                            <Body id={NEW_MODAL_CONTENT_ID}>
                                {icon && (
                                    <IconWrapper $variant={variant} $size={ICON_SIZE}>
                                        <Icon name={icon} size={ICON_SIZE} variant={variant} />
                                    </IconWrapper>
                                )}
                                {children}
                            </Body>
                        </ScrollContainer>
                        <ShadowBottom backgroundColor={modalBackgroundColor} />
                    </ShadowContainer>
                    {bottomContent && <Footer>{bottomContent}</Footer>}
                </Container>
            </NewModalContext.Provider>
        </ElevationContext>
    );
};

const NewModal = (props: NewModalProps) => {
    const { alignment, onCancel } = props;

    return (
        <NewModalBackdrop onClick={onCancel} alignment={alignment}>
            <NewModalBase {...props} />
        </NewModalBackdrop>
    );
};

NewModal.Button = NewModalButton;
NewModal.Backdrop = NewModalBackdrop;
NewModal.Provider = NewModalProvider;
NewModal.ModalBase = NewModalBase;

export { NewModal, NEW_MODAL_CONTENT_ID };
export type { NewModalProps, NewModalSize };
