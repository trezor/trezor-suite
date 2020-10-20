/* stylelint-disable indentation */

import * as React from 'react';
import styled, { css } from 'styled-components';
import { useKeyPress } from '../../utils/hooks';

import { Icon } from '../Icon';
import { H1 } from '../typography/Heading';
import { colors, variables } from '../../config';

// each item in array corresponds to a screen size  [SM, MD, LG, XL]
const ZERO_PADDING: [string, string, string, string] = ['0px', '0px', '0px', '0px'];

// padding for Modal container
const MODAL_PADDING_TOP: [string, string, string, string] = ['16px', '35px', '35px', '35px'];
const MODAL_PADDING_TOP_TINY: [string, string, string, string] = ['16px', '24px', '24px', '24px'];

const MODAL_PADDING_BOTTOM: [string, string, string, string] = ['16px', '35px', '35px', '35px'];
const MODAL_PADDING_BOTTOM_TINY: [string, string, string, string] = [
    '16px',
    '24px',
    '24px',
    '24px',
];

// padding for Heading, Description, Content and BottomBar
const SIDE_PADDING: [string, string, string, string] = ['8px', '40px', '40px', '40px'];
const SIDE_PADDING_TINY: [string, string, string, string] = ['8px', '32px', '32px', '32px'];

const FIXED_WIDTH: [string, string, string, string] = ['100vw', '90vw', '720px', '720px'];
const FIXED_WIDTH_SMALL: [string, string, string, string] = ['100vw', '90vw', '600px', '600px'];
const FIXED_WIDTH_TINY: [string, string, string, string] = ['360px', '360px', '360px', '360px'];
const FIXED_HEIGHT: [string, string, string, string] = ['90vh', '90vh', '620px', '620px'];

const ModalOverlay = styled.div`
    position: fixed;
    z-index: 10000;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    justify-content: center;
`;

const Header = styled.div`
    margin-bottom: 25px;
`;

type ModalWindowProps = Omit<
    Props,
    'fixedWidth' | 'fixedHeight' | 'modalPaddingBottom' | 'modalPaddingTop' | 'modalPaddingSide'
> &
    Required<
        Pick<
            Props,
            | 'fixedWidth'
            | 'fixedHeight'
            | 'modalPaddingBottom'
            | 'modalPaddingTop'
            | 'modalPaddingSide'
        >
    >; // make some props mandatory
const ModalWindow = styled.div<ModalWindowProps>`
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 6px;
  text-align: center;
  overflow-x: hidden; /* retains border-radius when using background in child component */
  padding: ${(props: ModalWindowProps) =>
      `${props.modalPaddingTop[3]} ${props.modalPaddingSide[3]} ${props.modalPaddingBottom[3]}`};

  /* prettier fails to format it properly */

  @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
    padding: ${(props: ModalWindowProps) =>
        `${props.modalPaddingTop[0]} ${props.modalPaddingSide[0]} ${props.modalPaddingBottom[0]}`};
  }

  @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) and (max-width: ${
    variables.SCREEN_SIZE.MD
}) {
    padding: ${(props: ModalWindowProps) =>
        `${props.modalPaddingTop[1]} ${props.modalPaddingSide[1]} ${props.modalPaddingBottom[1]}`};
  }

  @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) and (max-width: ${
    variables.SCREEN_SIZE.LG
}) {
    padding: ${(props: ModalWindowProps) =>
        `${props.modalPaddingTop[2]} ${props.modalPaddingSide[2]} ${props.modalPaddingBottom[2]}`};
  }

  ${props =>
      !props.noBackground &&
      css`
          background: ${colors.WHITE};
          box-shadow: 0 10px 80px 0 rgba(77, 77, 77, 0.2);
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
            max-width: 100vw;
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

const Heading = styled(H1)<{
    cancelable: boolean;
    showHeaderBorder: boolean;
    showProgressBar: boolean;
    hiddenProgressBar: boolean;
}>`
    display: flex;
    align-items: flex-start;
    word-break: break-word;
    padding: 28px 32px 22px 32px;
    margin-bottom: ${props => (props.showProgressBar ? 0 : '20px')};

    border-bottom: ${props =>
        props.showHeaderBorder ? `1px solid ${colors.NEUE_STROKE_GREY}` : 'none'};

    /* if progress bar with green bar is being showed, do not show header border (set color to white) */
    border-color: ${props =>
        props.showProgressBar && !props.hiddenProgressBar ? 'white' : colors.NEUE_STROKE_GREY};

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

const CancelIconWrapper = styled.div`
    display: inline-block;
    position: relative;
    top: auto;
    right: auto;
    align-items: center;
    margin-left: 30px;
    cursor: pointer;
`;

const ProgressBarPlaceholder = styled.div<{ hiddenProgressBar: boolean }>`
    height: 4px;
    width: 100%;
    margin-bottom: 20px;
    background-color: ${props => (props.hiddenProgressBar ? 'white' : colors.NEUE_STROKE_GREY)};
`;

const GreenBar = styled.div<{ width: number }>`
    height: 4px;
    position: relative;
    background-color: ${colors.NEUE_BG_GREEN};
    transition: all 0.5s;
    width: ${props => `${props.width}%`};
`;

const SidePaddingWrapper = styled.div<{ sidePadding: [string, string, string, string] }>`
    /* This component applies responsive side padding to all components that inherit from this component */
    padding-left: ${props => props.sidePadding[3]};
    padding-right: ${props => props.sidePadding[3]};

    /* prettier fails to format it properly */

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
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-bottom: 10px;
    text-align: center;
`;

const Content = styled(SidePaddingWrapper)<{ centerContent: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;

    ::-webkit-scrollbar {
        background-color: #fff;
        width: 10px;
    }
    /* background of the scrollbar except button or resizer */
    ::-webkit-scrollbar-track {
        background-color: transparent;
    }
    /* scrollbar itself */
    ::-webkit-scrollbar-thumb {
        /* 7F7F7F for mac-like color */
        background-color: #babac0;
        border-radius: 10px;
        border: 2px solid #fff;
    }
    /* set button(top and bottom of the scrollbar) */
    ::-webkit-scrollbar-button {
        display: none;
    }

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

const getFixedWidth = (size: SIZE) => {
    switch (size) {
        case 'large':
            return FIXED_WIDTH;
        case 'small':
            return FIXED_WIDTH_SMALL;
        case 'tiny':
            return FIXED_WIDTH_TINY;
        // no default
    }
};

// returns the value of padding-left/right for Heading, Description, Content and BottomBar
const getContentPaddingSide = (size: SIZE, noPadding: boolean) => {
    if (noPadding) {
        return ZERO_PADDING;
    }

    switch (size) {
        case 'large':
            return SIDE_PADDING;
        case 'small':
            return SIDE_PADDING;
        case 'tiny':
            return SIDE_PADDING_TINY;
        // no default
    }
};

const getModalPaddingTop = (size: SIZE, heading: React.ReactNode, noPadding: boolean) => {
    // if heading is present, do not add any padding to the top
    if (heading || noPadding) {
        return ZERO_PADDING;
    }

    switch (size) {
        case 'large':
            return MODAL_PADDING_TOP;
        case 'small':
            return MODAL_PADDING_TOP;
        case 'tiny':
            return MODAL_PADDING_TOP_TINY;
        // no default
    }
};

// returns the value of padding-bottom for the main Modal container
const getModalPaddingBottom = (size: SIZE, noPadding: boolean) => {
    if (noPadding) {
        return ZERO_PADDING;
    }

    switch (size) {
        case 'large':
            return MODAL_PADDING_BOTTOM;
        case 'small':
            return MODAL_PADDING_BOTTOM;
        case 'tiny':
            return MODAL_PADDING_BOTTOM_TINY;
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
    fixedWidth?: [string, string, string, string]; // [SM, MD, LG, XL]
    useFixedHeight?: boolean;
    fixedHeight?: [string, string, string, string]; // [SM, MD, LG, XL]
    modalPaddingTop?: [string, string, string, string]; // [SM, MD, LG, XL]
    modalPaddingBottom?: [string, string, string, string]; // [SM, MD, LG, XL]
    modalPaddingSide?: [string, string, string, string]; // [SM, MD, LG, XL]
    contentPaddingSide?: [string, string, string, string]; // [SM, MD, LG, XL]
    noPadding?: boolean;
    noBackground?: boolean;
    onCancel?: () => void;
    showHeaderBorder?: boolean;
    hiddenProgressBar?: boolean;
    totalProgressBarSteps?: number;
    currentProgressBarStep?: number;
    centerContent?: boolean;
}

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
    fixedHeight = FIXED_HEIGHT,
    noPadding = false,
    modalPaddingTop = getModalPaddingTop(size, heading, noPadding),
    modalPaddingBottom = getModalPaddingBottom(size, noPadding),
    modalPaddingSide = ZERO_PADDING, // default value is zero padding on sides for Modal container
    contentPaddingSide = getContentPaddingSide(size, noPadding),
    showHeaderBorder = true,
    hiddenProgressBar = false, // reserves the space for progress bar (4px under the heading), but not showing the green bar
    totalProgressBarSteps,
    currentProgressBarStep,
    centerContent = false,
    ...rest
}: Props) => {
    const escPressed = useKeyPress('Escape');

    // check if progress bar placeholder should be rendered
    const showProgressBarPlaceholder: boolean =
        hiddenProgressBar ||
        (totalProgressBarSteps !== undefined && currentProgressBarStep !== undefined);

    // compute progress bar width if all data is available and hiddenProgressBar is not selected
    let progressBarWidth = null;
    if (!hiddenProgressBar && totalProgressBarSteps && currentProgressBarStep) {
        progressBarWidth = (100 / totalProgressBarSteps) * currentProgressBarStep;
    }

    if (cancelable && onCancel && escPressed) {
        onCancel();
    }

    const modalWindow = (
        <ModalWindow
            size={size}
            useFixedWidth={useFixedWidth}
            fixedWidth={fixedWidth}
            useFixedHeight={useFixedHeight}
            fixedHeight={fixedHeight}
            modalPaddingTop={modalPaddingTop}
            modalPaddingBottom={modalPaddingBottom}
            modalPaddingSide={modalPaddingSide}
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
                    hiddenProgressBar={hiddenProgressBar}
                    showProgressBar={showProgressBarPlaceholder}
                >
                    {heading}
                    {cancelable && (
                        <CancelIconWrapper data-test="@modal/close-button" onClick={onCancel}>
                            <Icon size={24} color={colors.NEUE_TYPE_DARK_GREY} icon="CROSS" />
                        </CancelIconWrapper>
                    )}
                </Heading>
            )}

            {showProgressBarPlaceholder && (
                <ProgressBarPlaceholder hiddenProgressBar={hiddenProgressBar}>
                    {/* Make sure that hiddenProgressBar is not selected and that progressBarWidth was successfully computed */}
                    {!hiddenProgressBar && progressBarWidth && (
                        <GreenBar width={progressBarWidth} />
                    )}
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
    );

    if (noBackground) {
        return modalWindow;
    }

    // if there is some background, return modal with a blurred background
    return (
        <ModalOverlay
            onClick={() => {
                if (cancelable && onCancel) {
                    onCancel();
                }
            }}
        >
            {header && <Header>{header}</Header>}
            {modalWindow}
        </ModalOverlay>
    );
};

export { Modal, Props as ModalProps };
