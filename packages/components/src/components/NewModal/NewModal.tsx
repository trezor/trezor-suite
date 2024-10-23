import { ReactNode } from 'react';
import styled from 'styled-components';
import { useEvent } from 'react-use';
import {
    borders,
    Elevation,
    mapElevationToBackground,
    prevElevation,
    spacings,
    negativeSpacings,
    spacingsPx,
} from '@trezor/theme';

import { IconButton } from '../buttons/IconButton/IconButton';
import { Text } from '../typography/Text/Text';
import { H3 } from '../typography/Heading/Heading';
import { ElevationContext, ElevationUp, useElevation } from '../ElevationContext/ElevationContext';
import { useScrollShadow } from '../../utils/useScrollShadow';
import { IconCircle } from '../IconCircle/IconCircle';
import { IconName } from '../Icon/Icon';
import { Row } from '../Flex/Flex';
import { NewModalButton } from './NewModalButton';
import { NewModalContext } from './NewModalContext';
import { NewModalBackdrop } from './NewModalBackdrop';
import { NewModalProvider } from './NewModalProvider';
import { NewModalSize, NewModalAlignment, NewModalVariant } from './types';
import { mapModalSizeToWidth } from './utils';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedNewModalFrameProps = ['height'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedNewModalFrameProps)[number]>;

const NEW_MODAL_CONTENT_ID = 'modal-content';
const MODAL_ELEVATION = 0;

const Container = styled.div<
    TransientProps<AllowedFrameProps> & { $elevation: Elevation; $size: NewModalSize }
>`
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

    ${withFrameProps}
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

type ExclusiveIconNameOrComponent =
    | { iconName?: IconName; iconComponent?: undefined }
    | { iconName?: undefined; iconComponent?: ReactNode };

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
    'data-testid'?: string;
} & ExclusiveIconNameOrComponent;

const _NewModalBase = ({
    children,
    variant,
    size = 'medium',
    heading,
    description,
    bottomContent,
    iconName,
    iconComponent,
    onBackClick,
    onCancel,
    isBackdropCancelable,
    'data-testid': dataTest = '@modal',
    ...rest
}: NewModalProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedNewModalFrameProps);
    const { scrollElementRef, onScroll, ShadowContainer, ShadowTop, ShadowBottom } =
        useScrollShadow();

    const { elevation } = useElevation();

    const hasHeader = onBackClick || onCancel || heading || description;
    const isIconPushedTop = onCancel !== undefined && !heading && !description && !onBackClick;

    useEvent('keydown', (e: KeyboardEvent) => {
        if (isBackdropCancelable && onCancel && e.key === 'Escape') {
            onCancel?.();
        }
    });

    return (
        <Container
            $elevation={elevation}
            $size={size}
            onClick={e => e.stopPropagation()}
            data-testid={dataTest}
            {...frameProps}
        >
            {hasHeader && (
                <Header>
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

                        <HeadingContainer>
                            {heading && <H3 ellipsisLineCount={1}>{heading}</H3>}
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
                    </ElevationUp>
                </Header>
            )}
            <ShadowContainer>
                <ShadowTop />
                <ScrollContainer onScroll={onScroll} ref={scrollElementRef}>
                    <Body id={NEW_MODAL_CONTENT_ID}>
                        {(iconComponent || iconName) && (
                            <Row
                                margin={{
                                    bottom: spacings.md,
                                    top: isIconPushedTop ? negativeSpacings.md : 0,
                                }}
                            >
                                {iconComponent ??
                                    (iconName && (
                                        <IconCircle name={iconName} size={40} variant={variant} />
                                    ))}
                            </Row>
                        )}
                        <ElevationUp>{children}</ElevationUp>
                    </Body>
                </ScrollContainer>
                <ShadowBottom />
            </ShadowContainer>
            {bottomContent && (
                <Footer>
                    <ElevationUp>{bottomContent}</ElevationUp>
                </Footer>
            )}
        </Container>
    );
};
const NewModalBase = (props: NewModalProps) => (
    <ElevationContext baseElevation={prevElevation[MODAL_ELEVATION]}>
        <NewModalContext.Provider value={{ variant: props.variant }}>
            <_NewModalBase {...props} />
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
            <NewModalBase {...rest} />
        </NewModalBackdrop>
    );
};

NewModal.Button = NewModalButton;
NewModal.Backdrop = NewModalBackdrop;
NewModal.Provider = NewModalProvider;
NewModal.ModalBase = NewModalBase;

export { NewModal, NEW_MODAL_CONTENT_ID };
export type { NewModalProps, NewModalSize };
