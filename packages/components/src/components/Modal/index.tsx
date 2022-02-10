/* stylelint-disable indentation */
import * as React from 'react';
import styled, { css } from 'styled-components';
import { useKeyPress, useTheme } from '../../utils/hooks';

import { Icon } from '../Icon';
import { H1 } from '../typography/Heading';
import { variables } from '../../config';

type Padding = [string, string, string, string];

const ModalOverlay = styled.div<{ guidePanelSize: string }>`
    position: fixed;
    z-index: ${variables.Z_INDEX.MODAL};
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    justify-content: center;

    > * {
        margin-right: ${props => props.guidePanelSize};
        transition: all 0.3s;
    }
`;

const Header = styled.div`
    margin-bottom: 25px;
`;

type ModalWindowProps = Omit<Props, 'fixedWidth' | 'fixedHeight' | 'size'> &
    Required<Pick<Props, 'fixedWidth' | 'fixedHeight' | 'size'>>;

const pd = (size: SIZE, noPadding?: boolean) => {
    if (noPadding) return '0';
    return size === 'tiny' ? '24px' : '35px';
};

const ModalWindow = styled.div<ModalWindowProps>`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 16px;
    text-align: center;
    overflow-x: hidden; /* retains border-radius when using background in child component */
    transition: all 0.3s;

    ${({ size, noPadding, heading }) => css`
        padding-top: ${pd(size, !!heading || noPadding)};
        padding-bottom: ${pd(size, noPadding)};
        @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
            padding-top: ${heading || noPadding ? '0' : '16px'};
            padding-bottom: ${noPadding ? '0' : '16px'};
        }
        @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) and (max-width: ${variables
                .SCREEN_SIZE.MD}) {
            padding-top: ${pd(size, !!heading || noPadding)};
            padding-bottom: ${pd(size, noPadding)};
        }
        @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) and (max-width: ${variables
                .SCREEN_SIZE.LG}) {
            padding-top: ${pd(size, !!heading || noPadding)};
            padding-bottom: ${pd(size, noPadding)};
        }
    `}

    ${props =>
        !props.noBackground &&
        css`
            background: ${props => props.theme.BG_WHITE};
            box-shadow: 0 10px 80px 0 {props => props.theme.BOX_SHADOW_MODAL};
        `}

    /* if bottomBar is active we need to disable bottom padding */
    ${props =>
        props.bottomBar &&
        css`
            padding-bottom: 0px;
            @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
                padding-bottom: 0px;
            }
        `}

    /* content-based width mode */
    ${props =>
        !props.useFixedWidth &&
        css`
            max-width: 95vw;
        `}

    ${props =>
        !props.useFixedHeight &&
        css`
            max-height: 90vh;
        `}

    /* Fixed width mode */
    ${props =>
        props.useFixedWidth &&
        props.fixedWidth &&
        css`
            /* default width is the same as for XL screens */
            width: ${(props: ModalWindowProps) => props.fixedWidth[3]};
            /* for smaller screens width is set based on fixedWidth prop */
            @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
                width: ${(props: ModalWindowProps) => props.fixedWidth[0]};
            }
            @media only screen and (min-width: ${variables.SCREEN_SIZE
                    .SM}) and (max-width: ${variables.SCREEN_SIZE.MD}) {
                width: ${(props: ModalWindowProps) => props.fixedWidth[1]};
            }
            @media only screen and (min-width: ${variables.SCREEN_SIZE
                    .MD}) and (max-width: ${variables.SCREEN_SIZE.LG}) {
                width: ${(props: ModalWindowProps) => props.fixedWidth[2]};
            }
        `}

    ${props =>
        props.useFixedHeight &&
        props.fixedHeight &&
        css`
            /* default height is the same as for XL screens */
            height: ${(props: ModalWindowProps) => props.fixedHeight[3]};
            /* for smaller screens height is set based on fixedHeight prop */
            @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
                height: ${(props: ModalWindowProps) => props.fixedHeight[0]};
            }
            @media only screen and (min-width: ${variables.SCREEN_SIZE
                    .SM}) and (max-width: ${variables.SCREEN_SIZE.MD}) {
                height: ${(props: ModalWindowProps) => props.fixedHeight[1]};
            }
            @media only screen and (min-width: ${variables.SCREEN_SIZE
                    .MD}) and (max-width: ${variables.SCREEN_SIZE.LG}) {
                height: ${(props: ModalWindowProps) => props.fixedHeight[2]};
            }
        `}
`;

interface HeadingProps {
    cancelable: boolean;
    showHeaderBorder: boolean;
    showProgressBar: boolean;
    noHeadingPadding: boolean;
}

const Heading = styled(H1)<HeadingProps>`
    display: flex;
    align-items: flex-start;
    word-break: break-word;
    padding: ${props => (props.noHeadingPadding ? '0px' : '28px 32px 22px 32px')};
    margin-bottom: ${props => (props.showProgressBar ? 0 : '20px')};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    border-bottom: ${props =>
        props.showHeaderBorder ? `1px solid ${props.theme.STROKE_GREY}` : 'none'};

    /* if progress bar with green bar is being showed, do not show header border (set color to white) */
    border-color: ${props => (props.showProgressBar ? 'transparent' : props.theme.STROKE_GREY)};

    /* align content based on the 'cancelable' prop */
    text-align: ${props => (props.cancelable ? 'left' : 'center')};
    justify-content: ${props =>
        props.cancelable
            ? 'space-between'
            : 'center'}; /* space-between -> to move the closing button all the way to the right */

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 20px 22px 16px 22px;
    }
`;

const HeaderComponentsContainer = styled.div<{ isAbsolute: boolean }>`
    position: ${({ isAbsolute }) => isAbsolute && 'absolute'};
    right: ${({ isAbsolute }) => isAbsolute && '22px'};
    margin-left: ${({ isAbsolute }) => !isAbsolute && '30px'};

    ${variables.SCREEN_QUERY.ABOVE_MOBILE} {
        right: ${({ isAbsolute }) => isAbsolute && '30px'};
    }
`;

const CancelIconWrapper = styled.div<{ withComponents: boolean }>`
    display: inline-block;
    position: relative;
    top: auto;
    right: auto;
    align-items: center;
    margin-left: ${({ withComponents }) => (withComponents ? 20 : 30)}px;
    cursor: pointer;
`;

const ProgressBarPlaceholder = styled.div`
    height: 4px;
    width: 100%;
    margin-bottom: 20px;
    background-color: ${props => props.theme.STROKE_GREY};
`;

const GreenBar = styled.div<{ width: number }>`
    height: 4px;
    position: relative;
    background-color: ${props => props.theme.BG_GREEN};
    transition: all 0.5s;
    width: ${props => `${props.width}%`};
`;

const SidePaddingWrapper = styled.div<{ sidePadding: Padding }>`
    /* This component applies responsive side padding to all components that inherit from this component */
    padding-left: ${props => props.sidePadding[3]};
    padding-right: ${props => props.sidePadding[3]};

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-left: ${props => props.sidePadding[0]};
        padding-right: ${props => props.sidePadding[0]};
    }

    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) and (max-width: ${variables
            .SCREEN_SIZE.MD}) {
        padding-left: ${props => props.sidePadding[1]};
        padding-right: ${props => props.sidePadding[1]};
    }
`;

const Description = styled(SidePaddingWrapper)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-bottom: 10px;
    text-align: center;
`;

const Content = styled(SidePaddingWrapper)<{ centerContent: boolean }>`
    display: flex;
    color: ${props => props.theme.TYPE_DARK_GREY};
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;

    /* center the content if props.centerContent selected. For example useful for centering nested modals */
    ${props =>
        props.centerContent &&
        css`
            justify-content: center;
            align-items: center;
        `}
`;

const BottomBar = styled(SidePaddingWrapper)`
    display: flex;
    padding-top: 16px;
    padding-bottom: 16px;
`;

type SIZE = 'large' | 'small' | 'tiny';

const getFixedWidth = (size: SIZE): Padding => {
    switch (size) {
        case 'large':
            return ['95vw', '90vw', '720px', '720px'];
        case 'small':
            return ['95vw', '90vw', '600px', '600px'];
        case 'tiny':
            return ['360px', '360px', '360px', '360px'];
        // no default
    }
};

// returns the value of padding-left/right for Heading, Description, Content and BottomBar
const getContentPaddingSide = (size: SIZE, noPadding: boolean, noSidePadding: boolean): Padding => {
    if (noPadding || noSidePadding) {
        return ['0px', '0px', '0px', '0px'];
    }

    switch (size) {
        case 'large':
        case 'small':
            return ['16px', '40px', '40px', '40px'];
        case 'tiny':
            return ['16px', '32px', '32px', '32px'];
        // no default
    }
};

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    heading?: React.ReactNode;
    header?: React.ReactNode;
    description?: React.ReactNode;
    bottomBar?: React.ReactNode;
    cancelable?: boolean;
    size?: SIZE;
    useFixedWidth?: boolean;
    fixedWidth?: Padding; // [SM, MD, LG, XL]
    useFixedHeight?: boolean;
    fixedHeight?: Padding; // [SM, MD, LG, XL]
    contentPaddingSide?: Padding; // [SM, MD, LG, XL]
    noPadding?: boolean;
    noHeadingPadding?: boolean;
    noSidePadding?: boolean;
    noBackground?: boolean;
    onCancel?: () => void;
    showHeaderBorder?: boolean;
    hiddenProgressBar?: boolean;
    totalProgressBarSteps?: number;
    currentProgressBarStep?: number;
    centerContent?: boolean;
    isGuideOpen?: boolean;
    headerComponents?: Array<React.ReactElement>;
}

const ConditionalOverlay = ({
    condition,
    header,
    onClick,
    children,
    guidePanelSize,
}: {
    condition: boolean;
    header?: React.ReactNode;
    onClick: () => void;
    children: React.ReactElement;
    guidePanelSize: string;
}) =>
    condition ? (
        <ModalOverlay guidePanelSize={guidePanelSize} onClick={onClick} data-test="@modal">
            {header && <Header>{header}</Header>}
            {children}
        </ModalOverlay>
    ) : (
        children
    );

const Modal = ({
    children,
    heading,
    header,
    description,
    bottomBar,
    cancelable = false,
    onClick,
    onCancel,
    size = 'large',
    noBackground = false,
    useFixedWidth = true,
    fixedWidth = getFixedWidth(size),
    useFixedHeight = false,
    fixedHeight = ['90vh', '90vh', '620px', '620px'],
    noPadding = false,
    noHeadingPadding = false,
    noSidePadding = false,
    // TODO: get rid of all these padding props bellow. Usage should be simple: Either use default paddings provided by modal,
    // or use noPadding and then do all necessary work in components which will be passed as heading, description, children/content.
    // We cannot keep handling whole universe here for few stupid custom components
    contentPaddingSide = getContentPaddingSide(size, noPadding, noSidePadding),
    showHeaderBorder = true,
    totalProgressBarSteps,
    currentProgressBarStep,
    centerContent = false,
    isGuideOpen = false,
    headerComponents,
    ...rest
}: Props) => {
    const escPressed = useKeyPress('Escape');
    const theme = useTheme();

    // check if progress bar placeholder should be rendered
    const showProgressBarPlaceholder: boolean =
        totalProgressBarSteps !== undefined && currentProgressBarStep !== undefined;

    // compute progress bar width if all data is available and hiddenProgressBar is not selected
    let progressBarWidth = null;
    if (totalProgressBarSteps && currentProgressBarStep) {
        progressBarWidth = (100 / totalProgressBarSteps) * currentProgressBarStep;
    }

    if (cancelable && onCancel && escPressed) {
        onCancel();
    }

    return (
        <ConditionalOverlay
            guidePanelSize={isGuideOpen ? variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH : '0px'}
            onClick={() => {
                if (cancelable && onCancel) {
                    onCancel();
                }
            }}
            header={header}
            condition={!noBackground}
        >
            <ModalWindow
                size={size}
                useFixedWidth={useFixedWidth}
                fixedWidth={fixedWidth}
                useFixedHeight={useFixedHeight}
                fixedHeight={fixedHeight}
                bottomBar={bottomBar}
                noBackground={noBackground}
                onClick={e => {
                    if (onClick) onClick(e);
                    e.stopPropagation();
                }}
                {...rest}
            >
                {heading && (
                    <Heading
                        cancelable={cancelable}
                        showHeaderBorder={showHeaderBorder}
                        showProgressBar={showProgressBarPlaceholder}
                        noHeadingPadding={noHeadingPadding}
                    >
                        {heading}
                        {headerComponents && (
                            <HeaderComponentsContainer isAbsolute={!cancelable}>
                                {headerComponents}
                            </HeaderComponentsContainer>
                        )}
                        {cancelable && (
                            <CancelIconWrapper
                                data-test="@modal/close-button"
                                onClick={onCancel}
                                withComponents={!!headerComponents}
                            >
                                <Icon
                                    size={24}
                                    color={theme.TYPE_DARK_GREY}
                                    hoverColor={theme.TYPE_LIGHT_GREY}
                                    icon="CROSS"
                                />
                            </CancelIconWrapper>
                        )}
                    </Heading>
                )}

                {showProgressBarPlaceholder && (
                    <ProgressBarPlaceholder>
                        {/* Make sure that hiddenProgressBar is not selected and that progressBarWidth was successfully computed */}
                        {progressBarWidth && <GreenBar width={progressBarWidth} />}
                    </ProgressBarPlaceholder>
                )}

                {description && (
                    <Description sidePadding={contentPaddingSide}>{description}</Description>
                )}
                <Content sidePadding={contentPaddingSide} centerContent={centerContent}>
                    {children}
                </Content>
                {bottomBar && <BottomBar sidePadding={contentPaddingSide}>{bottomBar}</BottomBar>}
            </ModalWindow>
        </ConditionalOverlay>
    );
};

export type { Props as ModalProps };
export { Modal };
