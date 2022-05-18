/* stylelint-disable indentation */
import React, { useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';

import { useKeyPress, useTheme } from '../../utils/hooks';
import { Icon } from '../Icon';
import { H1 } from '../typography/Heading';
import { variables } from '../../config';
import { Progress } from '@trezor/components';
import { IconType } from '../../support/types';

const DevicePromptContainer = styled.div`
    margin-bottom: 25px;
`;

export interface HeaderProps {
    isBottomBorderShown: boolean;
    hasBottomPadding?: boolean;
}

const Header = styled.div<HeaderProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    word-break: break-word;
    padding: 24px 32px;
    padding-bottom: ${({ hasBottomPadding }) => !hasBottomPadding && 0};
    border-bottom: ${({ isBottomBorderShown, theme }) =>
        isBottomBorderShown ? `1px solid ${theme.STROKE_GREY}` : 'none'};
`;

const BackIcon = styled(Icon)`
    svg {
        width: 27px;
        height: 27px;
    }
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
        isHeadingCentered &&
        css`
            flex-grow: 1;
            margin-right: -${componentsWidth}px;
            margin-left: ${isWithBackButton && '-24px'};
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
    padding-left: 30px;
    margin-left: auto;

    > * + * {
        margin-left: 16px;
    }
`;

const Body = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 32px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 16px;
    }
`;

const Description = styled.div`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin: 0 auto 10px auto;
    max-width: fit-content; /* makes sure the description does not widen the modal beyond content width when the modal's width is "unset" */
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
    transition: all 0.3s;
    max-width: 95%;
    min-width: 305px;
    width: 720px;

    ${({ theme }) =>
        css`
            background: ${theme.BG_WHITE};
            box-shadow: 0 10px 80px 0 ${theme.BOX_SHADOW_MODAL};
        `}
`;

interface ModalProps {
    children?: React.ReactNode;
    heading?: React.ReactNode;
    subheading?: React.ReactNode;
    devicePrompt?: React.ReactNode;
    headerIcon?: IconType;
    isHeadingCentered?: boolean;
    description?: React.ReactNode;
    bottomBar?: React.ReactNode;
    isCancelable?: boolean;
    onBackClick?: () => void;
    onCancel?: () => void;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    totalProgressBarSteps?: number;
    currentProgressBarStep?: number;
    headerComponents?: Array<React.ReactNode>;
    className?: string;
    'data-test'?: string;
}

type ModalSubcomponents = {
    Header: typeof Header;
    Body: typeof Body;
    Description: typeof Description;
    Content: typeof Content;
    BottomBar: typeof BottomBar;
};

const Modal: React.FC<ModalProps> & ModalSubcomponents = ({
    children,
    heading,
    subheading,
    devicePrompt,
    headerIcon,
    isHeadingCentered = true,
    description,
    bottomBar,
    isCancelable,
    onClick,
    onBackClick,
    onCancel,
    totalProgressBarSteps,
    currentProgressBarStep,
    headerComponents,
    className,
    'data-test': dataTest = '@modal',
}) => {
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

    const showHeaderActions = !!headerComponents?.length || isCancelable;

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
            {devicePrompt && <DevicePromptContainer>{devicePrompt}</DevicePromptContainer>}

            <ModalWindow
                data-test={dataTest}
                className={className}
                onClick={e => {
                    onClick?.(e);
                    e.stopPropagation();
                }}
            >
                {(!!onBackClick || !!heading || showHeaderActions) && (
                    <Header
                        isBottomBorderShown={!showProgressBar && !!heading}
                        hasBottomPadding={!!heading}
                    >
                        {onBackClick && (
                            <BackIcon
                                icon="ARROW_LEFT"
                                size={24}
                                color={theme.TYPE_DARK_GREY}
                                hoverColor={theme.TYPE_LIGHT_GREY}
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
                                {headerComponents}

                                {isCancelable && (
                                    <Icon
                                        size={20}
                                        color={theme.TYPE_DARK_GREY}
                                        hoverColor={theme.TYPE_LIGHT_GREY}
                                        icon="CROSS"
                                        data-test="@modal/close-button"
                                        onClick={onCancel}
                                    />
                                )}
                            </HeaderComponentsContainer>
                        )}
                    </Header>
                )}

                {heading && showProgressBar && (
                    <Progress value={currentProgressBarStep} max={totalProgressBarSteps} />
                )}

                <Body>
                    {description && <Description>{description}</Description>}
                    <Content>{children}</Content>
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

export { Modal };
export type { ModalProps };
