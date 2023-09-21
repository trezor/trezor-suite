import { useCallback, useState, ReactNode, useEffect } from 'react';

import styled, { css, useTheme } from 'styled-components';
import { useEvent } from 'react-use';
import { boxShadows, spacings, spacingsPx, typography } from '@trezor/theme';

import { Icon } from '../assets/Icon/Icon';
import { IconType } from '../../support/types';
import { Stepper } from '../loaders/Stepper/Stepper';

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
    border-radius: 16px;
    transition: background 0.3s; // when theme changes from light to dark
    max-width: 95%;
    min-width: 305px;
    max-height: 90vh;
    width: 680px;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    box-shadow: ${boxShadows.elevation3};
`;

export interface HeaderProps {
    isBottomBorderShown: boolean;
}

const Header = styled.header<HeaderProps>`
    display: flex;
    align-items: center;
    word-break: break-word;
    min-height: 52px;
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    padding-bottom: ${({ isBottomBorderShown }) => (isBottomBorderShown ? spacingsPx.md : 0)};
    border-bottom: 1px solid
        ${({ isBottomBorderShown, theme }) =>
            isBottomBorderShown ? theme.borderOnElevation1 : 'transparent'};
`;

const BACK_ICON_WIDTH = spacingsPx.xxxl;
const BackIcon = styled(Icon)`
    position: relative;
    width: ${BACK_ICON_WIDTH};
    padding-right: ${spacingsPx.lg};
    margin-left: auto;
`;

interface HeadingContainerProps {
    isHeadingCentered?: boolean;
    isWithBackButton?: boolean;
    componentsWidth?: number;
}

const HeadingContainer = styled.div<HeadingContainerProps>`
    display: flex;
    flex-direction: column;
    align-items: start;
    text-align: left;

    ${({ isHeadingCentered, componentsWidth, isWithBackButton }) =>
        (isHeadingCentered || isWithBackButton) &&
        css`
            flex-grow: 1;
            margin-right: -${componentsWidth}px;
            margin-left: ${isWithBackButton && `-${BACK_ICON_WIDTH}`};
            padding: 0 ${spacingsPx.md};
            align-items: center;
            text-align: center;
        `}
`;

const Heading = styled.h1<{ isWithIcon?: boolean }>`
    display: flex;
    align-items: baseline;
    ${typography.titleSmall}

    ${({ isWithIcon }) =>
        isWithIcon &&
        css`
            padding-right: 16px;

            > :first-child {
                margin-right: ${spacingsPx.xs};
            }
        `}
`;

const Subheading = styled.span<{ isWithMargin: boolean }>`
    margin-left: ${({ isWithMargin }) => isWithMargin && spacingsPx.xl};
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

const Body = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    margin-bottom: ${spacingsPx.md};
    padding: ${spacingsPx.md} ${spacingsPx.md} 0;
    overflow-y: auto;

    ::-webkit-scrollbar {
        display: none;
    }
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
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation1};
`;

const BottomBarComponents = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const CloseIcon = styled(Icon)`
    width: ${CLOSE_ICON_SIZE}px;
    height: ${CLOSE_ICON_SIZE}px;
    background: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation1};
    border-radius: 50%;
    transition: opacity 0.2s;

    :hover {
        opacity: 0.7;
    }
`;

interface ModalProps {
    children?: ReactNode;
    heading?: ReactNode;
    preheading?: ReactNode;
    subheading?: ReactNode;
    modalPrompt?: ReactNode;
    headerIcon?: IconType;
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
    'data-test'?: string;
}

const Modal = ({
    children,
    heading,
    preheading,
    subheading,
    modalPrompt,
    headerIcon,
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
    'data-test': dataTest = '@modal',
}: ModalProps) => {
    const [componentsWidth, setComponentsWidth] = useState<number>();
    const theme = useTheme();

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

    return (
        <>
            {modalPrompt && <ModalPromptContainer>{modalPrompt}</ModalPromptContainer>}

            <Container
                onClick={e => e.stopPropagation()} // needed because of the Backdrop implementation
                data-test={dataTest}
                className={className}
            >
                {(!!onBackClick || !!heading || showHeaderActions) && (
                    <Header isBottomBorderShown={!!heading}>
                        {onBackClick && (
                            <BackIcon
                                icon="ARROW_LEFT"
                                size={24}
                                color={theme.iconSubdued}
                                hoverColor={theme.iconOnTertiary}
                                onClick={onBackClick}
                            />
                        )}

                        {heading && (
                            <HeadingContainer
                                componentsWidth={componentsWidth}
                                isHeadingCentered={isHeadingCentered}
                                isWithBackButton={!!onBackClick}
                            >
                                {preheading && (
                                    <Subheading isWithMargin={!!headerIcon}>
                                        {preheading}
                                    </Subheading>
                                )}

                                <Heading isWithIcon={!!headerIcon}>
                                    {headerIcon && (
                                        <Icon
                                            icon={headerIcon}
                                            size={16}
                                            color={theme.iconDefault}
                                        />
                                    )}
                                    {heading}
                                </Heading>

                                {subheading && (
                                    <Subheading isWithMargin={!!headerIcon}>
                                        {subheading}
                                    </Subheading>
                                )}
                            </HeadingContainer>
                        )}

                        {showHeaderActions && (
                            <HeaderComponentsContainer ref={measureComponentsRef}>
                                {headerComponent}

                                {isCancelable && (
                                    <CloseIcon
                                        size={14}
                                        color={theme.iconOnTertiary}
                                        icon="CROSS"
                                        data-test="@modal/close-button"
                                        onClick={onCancel}
                                    />
                                )}
                            </HeaderComponentsContainer>
                        )}
                    </Header>
                )}

                <Body>
                    {description && <Description>{description}</Description>}
                    <Content id="modal-content">{children}</Content>
                </Body>

                {(bottomBarComponents || areStepsShown) && (
                    <BottomBar>
                        {areStepsShown && (
                            <Stepper step={currentProgressBarStep} total={totalProgressBarSteps} />
                        )}

                        <BottomBarComponents>{bottomBarComponents}</BottomBarComponents>
                    </BottomBar>
                )}
            </Container>
        </>
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
