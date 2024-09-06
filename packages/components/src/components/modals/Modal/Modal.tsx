import { useCallback, useState, ReactNode, useEffect } from 'react';

import styled, { css, useTheme } from 'styled-components';
import { useEvent } from 'react-use';
import { borders, spacings, spacingsPx, typography } from '@trezor/theme';

import { Stepper } from '../../loaders/Stepper/Stepper';
import { IconButton } from '../../buttons/IconButton/IconButton';
import { H3 } from '../../typography/Heading/Heading';
import { ButtonSize } from '../../buttons/buttonStyleUtils';
import { ElevationContext } from '../../ElevationContext/ElevationContext';
import { useScrollShadow } from '../../../utils/useScrollShadow';
import { Icon, IconName } from '../../Icon/Icon';

const CLOSE_ICON_SIZE = spacings.xxl;
const CLOSE_ICON_MARGIN = 16;
const MODAL_CONTENT_ID = 'modal-content';

const ModalPromptContainer = styled.div`
    margin-bottom: 25px;
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: ${borders.radii.md};

    /* when theme changes from light to dark */
    transition: background 0.3s;
    max-width: 95%;
    min-width: 305px;
    max-height: 90vh;
    width: 680px;

    /* Model has intentionally always Elevation = 1 (it resets the elevation) */
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
`;

export interface HeaderProps {
    $isBottomBorderShown: boolean;
}

const Header = styled.header<HeaderProps>`
    display: flex;
    align-items: center;
    word-break: break-word;
    min-height: 52px;
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    border-bottom: 1px solid
        ${({ $isBottomBorderShown, theme }) =>
            $isBottomBorderShown ? theme.borderElevation2 : 'transparent'};
`;

const BACK_ICON_WIDTH = spacingsPx.xxxl;
// eslint-disable-next-line local-rules/no-override-ds-component
const BackIcon = styled(Icon)`
    position: relative;
    width: ${BACK_ICON_WIDTH};
    padding-right: ${spacingsPx.lg};
    margin-left: auto;
`;

interface HeadingContainerProps {
    $isHeadingCentered?: boolean;
    $isWithBackButton?: boolean;
    $componentsWidth?: number;
}

const HeadingContainer = styled.div<HeadingContainerProps>`
    display: flex;
    flex-direction: column;
    align-items: start;
    text-align: left;

    ${({ $isHeadingCentered, $componentsWidth, $isWithBackButton }) =>
        ($isHeadingCentered || $isWithBackButton) &&
        css`
            flex-grow: 1;
            margin-right: -${$componentsWidth}px;
            margin-left: ${$isWithBackButton && `-${BACK_ICON_WIDTH}`};
            padding: 0 ${spacingsPx.md};
            align-items: center;
            text-align: center;
        `}
`;

const HEADING_SIZES: Record<string, { css: string; buttonSize: ButtonSize }> = {
    default: { css: typography.titleSmall, buttonSize: 'small' },
    large: { css: typography.titleMedium, buttonSize: 'medium' },
};

type HeadingSize = keyof typeof HEADING_SIZES;

type HeadingProps = { $isWithIcon?: boolean; $headingSize: HeadingSize };

// eslint-disable-next-line local-rules/no-override-ds-component
const Heading = styled(H3)<HeadingProps>`
    ${({ $isWithIcon }) =>
        $isWithIcon &&
        css`
            padding-right: ${spacingsPx.md};

            > :first-child {
                margin-right: ${spacingsPx.xs};
            }
        `}
    ${({ $headingSize }) => HEADING_SIZES[$headingSize].css};
`;

const Subheading = styled.span<{ $isWithMargin: boolean }>`
    margin-left: ${({ $isWithMargin }) => $isWithMargin && spacingsPx.xl};
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const HeaderComponentsContainer = styled.div`
    display: flex;
    align-items: center;
    height: 100%;
    padding-left: ${CLOSE_ICON_MARGIN}px;
    margin-left: auto;

    > * + * {
        margin-left: ${CLOSE_ICON_MARGIN}px;
    }
`;

const ScrollContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    overflow-y: auto;

    ::-webkit-scrollbar {
        display: none;
    }
`;
const Body = styled.div<{ $isWithoutTopPadding: boolean }>`
    padding: ${spacingsPx.xl} ${spacingsPx.md};
    padding-top: ${({ $isWithoutTopPadding }) => $isWithoutTopPadding && 0};
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const Description = styled.div`
    margin-bottom: ${spacingsPx.md};
    max-width: fit-content; /* makes sure the description does not widen the modal beyond content width when the modal's width is "unset" */
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
    text-align: left;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
`;

const BottomBar = styled.footer`
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: ${spacingsPx.xs};
    padding: ${spacingsPx.md};
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
`;

const BottomBarComponents = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

interface ModalProps {
    children?: ReactNode;
    heading?: ReactNode;
    preheading?: ReactNode;
    subheading?: ReactNode;
    modalPrompt?: ReactNode;
    headerIcon?: IconName;
    headingSize?: HeadingSize;
    isHeadingCentered?: boolean;
    description?: ReactNode;
    bottomBarComponents?: ReactNode;
    isCancelable?: boolean;
    onBackClick?: () => void;
    onCancel?: () => void;
    totalProgressBarSteps?: number;
    currentProgressBarStep?: number;
    headerComponent?: ReactNode;
    className?: string;
    hasBackdropCancel?: boolean;
    'data-testid'?: string;
}

/**
 * @deprecated Use NewModal.
 */
const Modal = ({
    children,
    heading,
    preheading,
    subheading,
    modalPrompt,
    headerIcon,
    headingSize = 'default',
    isHeadingCentered,
    description, // LEGACY PROP
    bottomBarComponents,
    isCancelable,
    onBackClick,
    onCancel,
    totalProgressBarSteps,
    currentProgressBarStep,
    headerComponent,
    className,
    'data-testid': dataTest = '@modal',
}: ModalProps) => {
    const [componentsWidth, setComponentsWidth] = useState<number>();
    const theme = useTheme();
    const { scrollElementRef, onScroll, ShadowContainer, ShadowTop, ShadowBottom } =
        useScrollShadow();
    const showHeaderActions = !!headerComponent || isCancelable;

    useEffect(() => {
        if (!showHeaderActions) {
            setComponentsWidth(undefined);
        }
    }, [showHeaderActions]);

    useEvent('keydown', (e: KeyboardEvent) => {
        if (onCancel && e.key === 'Escape') {
            onCancel?.();
        }
    });

    const measureComponentsRef = useCallback(
        (element: HTMLDivElement | null) => setComponentsWidth(element?.offsetWidth),
        [],
    );

    const areStepsShown =
        totalProgressBarSteps !== undefined && currentProgressBarStep !== undefined;

    // Model has intentionally always Elevation = 1 (it resets the elevation)
    return (
        <ElevationContext baseElevation={1}>
            {modalPrompt && <ModalPromptContainer>{modalPrompt}</ModalPromptContainer>}

            <Container
                onClick={e => e.stopPropagation()} // needed because of the Backdrop implementation
                data-testid={dataTest}
                className={className}
            >
                {(!!onBackClick || !!heading || showHeaderActions) && (
                    <Header $isBottomBorderShown={!!heading}>
                        {onBackClick && (
                            <BackIcon
                                name="caretLeft"
                                size={24}
                                color={theme.iconSubdued}
                                hoverColor={theme.iconOnTertiary}
                                onClick={onBackClick}
                            />
                        )}

                        {heading && (
                            <HeadingContainer
                                $componentsWidth={componentsWidth}
                                $isHeadingCentered={isHeadingCentered}
                                $isWithBackButton={!!onBackClick}
                            >
                                {preheading && (
                                    <Subheading $isWithMargin={!!headerIcon}>
                                        {preheading}
                                    </Subheading>
                                )}

                                <Heading $headingSize={headingSize} $isWithIcon={!!headerIcon}>
                                    {headerIcon && (
                                        <Icon
                                            name={headerIcon}
                                            size={16}
                                            color={theme.iconDefault}
                                        />
                                    )}
                                    {heading}
                                </Heading>

                                {subheading && (
                                    <Subheading $isWithMargin={!!headerIcon}>
                                        {subheading}
                                    </Subheading>
                                )}
                            </HeadingContainer>
                        )}

                        {showHeaderActions && (
                            <HeaderComponentsContainer ref={measureComponentsRef}>
                                {headerComponent}

                                {isCancelable && (
                                    <IconButton
                                        variant="tertiary"
                                        icon="close"
                                        data-testid="@modal/close-button"
                                        onClick={onCancel}
                                        size={HEADING_SIZES[headingSize].buttonSize}
                                    />
                                )}
                            </HeaderComponentsContainer>
                        )}
                    </Header>
                )}
                <ShadowContainer>
                    <ShadowTop />
                    <ScrollContainer onScroll={onScroll} ref={scrollElementRef}>
                        <Body $isWithoutTopPadding={!heading && !!isCancelable}>
                            {description && <Description>{description}</Description>}
                            <Content id="modal-content">{children}</Content>
                        </Body>
                    </ScrollContainer>
                    <ShadowBottom
                        style={{
                            borderBottomLeftRadius: borders.radii.md,
                            borderBottomRightRadius: borders.radii.md,
                        }}
                    />
                </ShadowContainer>
                {(bottomBarComponents || areStepsShown) && (
                    <BottomBar>
                        {areStepsShown && (
                            <Stepper step={currentProgressBarStep} total={totalProgressBarSteps} />
                        )}

                        <BottomBarComponents>{bottomBarComponents}</BottomBarComponents>
                    </BottomBar>
                )}
            </Container>
        </ElevationContext>
    );
};

Modal.Header = Header;
Modal.Body = Body;
Modal.Description = Description;
Modal.Content = Content;
Modal.BottomBar = BottomBar;
Modal.closeIconWidth = CLOSE_ICON_SIZE + CLOSE_ICON_MARGIN; // TODO: find a way to get rid of

export { Modal, MODAL_CONTENT_ID };
export type { ModalProps };
