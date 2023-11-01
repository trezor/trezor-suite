/* stylelint-disable indentation */
import { useCallback, useEffect, useState, ReactNode, MouseEvent } from 'react';

import styled, { css } from 'styled-components';

import { useKeyPress } from '@trezor/react-utils';
import { useTheme } from '../../utils/hooks';
import { Icon } from '../assets/Icon/Icon';
import { H1 } from '../typography/Heading/Heading';
import { variables } from '../../config';
import { IconType } from '../../support/types';
import { ProgressBar } from '../loaders/ProgressBar/ProgressBar';

const CLOSE_ICON_SIDE = 26;
const CLOSE_ICON_PADDING = 16;
const MODAL_CONTENT_ID = 'modal-content';

const ModalPromptContainer = styled.div`
    margin-bottom: 25px;
`;

export interface HeaderProps {
    isBottomBorderShown: boolean;
    hasText?: boolean;
}

const Header = styled.div<HeaderProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    word-break: break-word;
    height: ${({ hasText }) => hasText && '80px'};
    padding: 0 32px;
    padding-bottom: ${({ hasText }) => !hasText && 0};
    border-bottom: ${({ isBottomBorderShown, theme }) =>
        isBottomBorderShown ? `1px solid ${theme.STROKE_GREY}` : 'none'};
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
            margin-left: ${isWithBackButton && '-40px'};
            padding: 0 28px;
            align-items: center;
            text-align: center;
        `}
`;

const StyledH1 = styled(H1)<{ isWithIcon?: boolean }>`
    display: flex;
    align-items: baseline;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 32px;

    ${({ isWithIcon }) =>
        isWithIcon &&
        css`
            padding-right: 14px;

            > :first-child {
                margin-right: 8px;
            }
        `}
`;

const Subheading = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const HeaderComponentsContainer = styled.div`
    display: flex;
    align-items: center;
    height: 100%;
    padding-left: ${CLOSE_ICON_PADDING}px;
    margin-left: auto;

    > * + * {
        margin-left: ${CLOSE_ICON_SIDE}px;
    }
`;

const Body = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    margin-bottom: 32px;
    padding: 32px 32px 0;
    overflow-y: auto;

    ::-webkit-scrollbar {
        display: none;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 16px 16px 0;
        margin-bottom: 16px;
    }
`;

const Description = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin: 0 auto 18px auto;
    max-width: fit-content; /* makes sure the description does not widen the modal beyond content width when the modal's width is "unset" */
    text-align: left;
`;

const Content = styled.div`
    display: flex;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    flex-direction: column;
    width: 100%;
    height: 100%;
`;

const BottomBar = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 0 32px 32px;
    gap: 16px;
`;

const ModalWindow = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 16px;
    text-align: center;
    transition:
        background 0.3s,
        box-shadow 0.3s;
    max-width: 95%;
    min-width: 305px;
    max-height: 90vh;
    width: 680px;

    ${({ theme }) => css`
        background: ${theme.BG_WHITE};
        box-shadow: 0 10px 80px 0 ${theme.BOX_SHADOW_MODAL};
    `}
`;

const CloseIcon = styled(Icon)`
    width: ${CLOSE_ICON_SIDE}px;
    height: ${CLOSE_ICON_SIDE}px;
`;

const BackIcon = styled(Icon)`
    position: relative;
    width: 40px;
    height: 27px;
    padding-right: 20px;
    margin-left: auto;
`;

interface ModalProps {
    children?: ReactNode;
    heading?: ReactNode;
    subheading?: ReactNode;
    modalPrompt?: ReactNode;
    headerIcon?: IconType;
    isHeadingCentered?: boolean;
    description?: ReactNode;
    bottomBar?: ReactNode;
    isCancelable?: boolean;
    onBackClick?: () => void;
    onCancel?: () => void;
    onClick?: (e: MouseEvent<HTMLDivElement>) => void;
    totalProgressBarSteps?: number;
    currentProgressBarStep?: number;
    headerComponent?: ReactNode;
    className?: string;
    'data-test'?: string;
}

const Modal = ({
    children,
    heading,
    subheading,
    modalPrompt,
    headerIcon,
    isHeadingCentered,
    description,
    bottomBar,
    isCancelable,
    onClick,
    onBackClick,
    onCancel,
    totalProgressBarSteps,
    currentProgressBarStep,
    headerComponent,
    className,
    'data-test': dataTest = '@modal',
}: ModalProps) => {
    const [componentsWidth, setComponentsWidth] = useState<number>();
    const escPressed = useKeyPress('Escape');
    const theme = useTheme();

    const measureComponentsRef = useCallback((element: HTMLDivElement | null) => {
        if (element) {
            setComponentsWidth(element?.offsetWidth);
        }
    }, []);

    // check if progress bar placeholder should be rendered
    const showProgressBar =
        totalProgressBarSteps !== undefined && currentProgressBarStep !== undefined;

    const showHeaderActions = !!headerComponent || isCancelable;

    if (isCancelable && escPressed) {
        onCancel?.();
    }

    useEffect(() => {
        if (isCancelable && escPressed) {
            onCancel?.();
        }
    }, [isCancelable, onCancel, escPressed]);

    return (
        <>
            {modalPrompt && <ModalPromptContainer>{modalPrompt}</ModalPromptContainer>}

            <ModalWindow
                data-test={dataTest}
                className={className}
                onClick={e => {
                    onClick?.(e);
                    e.stopPropagation();
                }}
            >
                {(!!onBackClick || !!heading || showHeaderActions) && (
                    <Header isBottomBorderShown={!showProgressBar && !!heading} hasText={!!heading}>
                        {onBackClick && (
                            <BackIcon
                                icon="ARROW_LEFT"
                                size={24}
                                color={theme.TYPE_LIGHT_GREY}
                                hoverColor={theme.TYPE_LIGHTER_GREY}
                                onClick={onBackClick}
                            />
                        )}

                        {heading && (
                            <HeadingContainer
                                componentsWidth={componentsWidth}
                                isHeadingCentered={isHeadingCentered}
                                isWithBackButton={!!onBackClick}
                            >
                                <StyledH1 noMargin isWithIcon={!!headerIcon}>
                                    {headerIcon && (
                                        <Icon
                                            icon={headerIcon}
                                            size={20}
                                            color={theme.TYPE_DARK_GREY}
                                        />
                                    )}
                                    {heading}
                                </StyledH1>

                                {subheading && <Subheading>{subheading}</Subheading>}
                            </HeadingContainer>
                        )}

                        {showHeaderActions && (
                            <HeaderComponentsContainer ref={measureComponentsRef}>
                                {headerComponent}

                                {isCancelable && (
                                    <CloseIcon
                                        size={20}
                                        color={theme.TYPE_LIGHT_GREY}
                                        hoverColor={theme.TYPE_LIGHTER_GREY}
                                        icon="CROSS"
                                        data-test="@modal/close-button"
                                        onClick={onCancel}
                                    />
                                )}
                            </HeaderComponentsContainer>
                        )}
                    </Header>
                )}

                {showProgressBar && (
                    <ProgressBar value={currentProgressBarStep} max={totalProgressBarSteps} />
                )}

                <Body>
                    {description && <Description>{description}</Description>}
                    <Content id="modal-content">{children}</Content>
                </Body>

                {bottomBar && <BottomBar>{bottomBar}</BottomBar>}
            </ModalWindow>
        </>
    );
};

Modal.Header = Header;
Modal.Body = Body;
Modal.Description = Description;
Modal.Content = Content;
Modal.BottomBar = BottomBar;
Modal.closeIconWidth = CLOSE_ICON_SIDE + CLOSE_ICON_PADDING;

export { Modal, MODAL_CONTENT_ID };
export type { ModalProps };
