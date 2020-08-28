/* stylelint-disable indentation */

import * as React from 'react';
import styled, { css } from 'styled-components';
import { useKeyPress } from '../../utils/hooks';

import { Icon } from '../Icon';
import { H2 } from '../typography/Heading';
import { colors, variables } from '../../config';

// each item in array corresponds to a screen size  [SM, MD, LG, XL]
const PADDING: [string, string, string, string] = [
    '16px 8px',
    '35px 40px',
    '35px 40px',
    '35px 40px',
];

const PADDING_TINY: [string, string, string, string] = [
    '16px 8px',
    '35px 24px',
    '35px 24px',
    '35px 24px',
];

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

const CancelIconWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-left: 30px;
    cursor: pointer;
`;

type ModalWindowProps = Omit<Props, 'padding' | 'fixedWidth' | 'fixedHeight'> &
    Required<Pick<Props, 'padding' | 'fixedWidth' | 'fixedHeight'>>; // make some props mandatory
const ModalWindow = styled.div<ModalWindowProps>`
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 6px;
  text-align: center;
  overflow-x: hidden; /* retains border-radius when using background in child component */
  padding: ${(props: ModalWindowProps) => props.padding[3]};

  /* prettier fails to format it properly */

  @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
    padding: ${(props: ModalWindowProps) => props.padding[0]};
  }

  @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) and (max-width: ${
    variables.SCREEN_SIZE.MD
}) {
    padding: ${(props: ModalWindowProps) => props.padding[1]};
  }

  @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) and (max-width: ${
    variables.SCREEN_SIZE.LG
}) {
    padding: ${(props: ModalWindowProps) => props.padding[2]};
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

const Wrapper = styled.div<{ padding: [string, string, string, string] }>`
    padding: ${props => props.padding[3]};

    /* prettier fails to format it properly */

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: ${props => props.padding[0]};
    }

    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) and (max-width: ${variables
            .SCREEN_SIZE.MD}) {
        padding: ${props => props.padding[1]};
    }

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) and (max-width: ${variables
            .SCREEN_SIZE.LG}) {
        padding: ${props => props.padding[2]};
    }
`;

const Heading = styled(H2)`
    display: flex;
    text-align: center;
    justify-content: space-between;
    padding: 24px 32px;
    margin-bottom: 0px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        /* make sure heading doesn't overflow over close button */
        padding-right: 20px;
        padding-left: 20px;
    }
`;

const NoBarHeading = styled(H2)<{ noPadding: boolean }>`
    text-align: center;
    ${props =>
        !props.noPadding &&
        css`
            @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
                /* make sure heading doesn't overflow over close button */
                padding-right: 20px;
                padding-left: 20px;
            }
        `}
`;

const Content = styled.div<{ showHeaderBar: boolean; contentPadding: string }>`
    display: flex;
    flex-direction: column;
    width: auto;
    height: 100%;
    overflow-y: auto;

    /* add margin to make sure there is some space between the scrollbar and the edge of the modal */
    margin: ${props => (props.showHeaderBar ? '0px 8px 0px 8px' : '0')};

    padding: ${props => props.contentPadding};

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        /* make sure heading doesn't overflow over close button */
        padding: ${props => (props.showHeaderBar ? PADDING_TINY[0] : '0')};
    }

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
`;

const Description = styled.div<{ showHeaderBar: boolean }>`
    text-align: center;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.NORMAL};
    padding-left: 16px;
    padding-right: 16px;
    margin-bottom: ${props => (props.showHeaderBar ? '0px' : '10px')};
    margin-top: ${props => (props.showHeaderBar ? '20px' : '0px')};
    padding-bottom: ${props => (props.showHeaderBar ? '4px' : '0px')};
`;

const BottomBar = styled.div<{ showHeaderBar: boolean }>`
    display: flex;
    padding: ${props => (props.showHeaderBar ? '16px 40px 16px 40px' : '16px 0 16px 0')};

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        /* make sure heading doesn't overflow over close button */
        padding-right: 20px;
        padding-left: 20px;
        padding-bottom: 16px;
    }
`;

const NoBarCancelIconWrapper = styled.div`
    display: flex;
    align-items: center;
    position: absolute;
    right: 0;
    top: 0;
    padding: 10px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK25};

    :hover {
        text-decoration: none;
        color: ${colors.BLACK0};
    }
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

const getPadding = (size: SIZE) => {
    switch (size) {
        case 'large':
            return PADDING;
        case 'small':
            return PADDING;
        case 'tiny':
            return PADDING_TINY;
        // no default
    }
};

const getContentPadding = (showHeaderBar: boolean, bottomBar: React.ReactNode) => {
    if (showHeaderBar && !bottomBar) {
        return '12px 32px 40px 32px';
    }
    if (showHeaderBar && bottomBar) {
        return '12px 32px 0px 32px';
    }
    // return zero padding none of the above
    return '0';
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
    padding?: [string, string, string, string]; // [SM, MD, LG, XL]
    noBackground?: boolean;
    onCancel?: () => void;
    hideCancelButton?: boolean;
    showHeaderBar?: boolean;
    contentPadding?: string;
}

const Modal = ({
    children,
    heading,
    header,
    description,
    bottomBar,
    cancelable,
    onClick,
    onCancel,
    size = 'large',
    padding = getPadding(size), // ['16px 8px', '35px 40px', '35px 40px', '35px 40px']
    noBackground = false,
    useFixedWidth = true,
    fixedWidth = getFixedWidth(size),
    useFixedHeight = false,
    fixedHeight = FIXED_HEIGHT,
    hideCancelButton = false,
    showHeaderBar = true,
    contentPadding = getContentPadding(showHeaderBar, bottomBar),
    ...rest
}: Props) => {
    const escPressed = useKeyPress('Escape');

    if (cancelable && onCancel && escPressed) {
        onCancel();
    }

    const modalWindow = (
        <ModalWindow
            size={size}
            padding={showHeaderBar ? ['0px', '0px', '0px', '0px'] : padding}
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
            {heading &&
                // there are two modal Heading designs that are displayed based on showHeaderBar
                (showHeaderBar ? (
                    <Heading>
                        {heading}
                        {cancelable && !hideCancelButton && (
                            <CancelIconWrapper onClick={onCancel}>
                                <Icon size={24} color={colors.NEUE_TYPE_DARK_GREY} icon="CROSS" />
                            </CancelIconWrapper>
                        )}
                    </Heading>
                ) : (
                    <>
                        <NoBarHeading noPadding={hideCancelButton}>{heading}</NoBarHeading>

                        <NoBarCancelIconWrapper onClick={onCancel}>
                            <Icon size={24} color={colors.NEUE_TYPE_DARK_GREY} icon="CROSS" />
                        </NoBarCancelIconWrapper>
                    </>
                ))}

            {description && <Description showHeaderBar={showHeaderBar}>{description}</Description>}
            <Content showHeaderBar={showHeaderBar} contentPadding={contentPadding}>
                {children}
            </Content>
            {bottomBar && <BottomBar showHeaderBar={showHeaderBar}>{bottomBar}</BottomBar>}
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
