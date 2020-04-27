import * as React from 'react';
import styled, { css } from 'styled-components';
import { useKeyPress, useOnClickOutside } from '../../utils/hooks';

import { Link } from '../typography/Link';
import { Icon } from '../Icon';
import { H2 } from '../typography/Heading';
import { colors, variables } from '../../config';
import { useRef } from 'react';

const DEFAULT_PADDING = '35px 40px';
const DEFAULT_PADDING_SMALL = '16px 8px'; // used on SM screens

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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
`;

const ModalWindow = styled.div<Props>`
    display: flex;
    flex-direction: column;
    margin: auto;
    position: relative;
    border-radius: 6px;
    background-color: ${colors.WHITE};
    box-shadow: 0 10px 60px 0 ${colors.BLACK25};
    text-align: center;
    padding: ${props => props.padding || DEFAULT_PADDING};
    overflow-x: hidden; /* retains border-radius when using background in child component */
    
    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: ${props => props.paddingSmall || DEFAULT_PADDING_SMALL} ;
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
            /* default width is the size as for XL screens */
            width: ${(props: Props) => props.fixedWidth![3]};
            /* for smaller screens width is set based on fixedWidth prop */
            @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
                width: ${(props: Props) => props.fixedWidth![0]};
            }
            @media only screen and (min-width: ${variables.SCREEN_SIZE
                    .SM}) and (max-width: ${variables.SCREEN_SIZE.MD}) {
                width: ${(props: Props) => props.fixedWidth![1]};
            }
            @media only screen and (min-width: ${variables.SCREEN_SIZE
                    .MD}) and (max-width: ${variables.SCREEN_SIZE.LG}) {
                width: ${(props: Props) => props.fixedWidth![2]};
            }
        `}

    ${props =>
        props.useFixedHeight &&
        props.fixedHeight &&
        css`
            /* default height is the size as for XL screens */
            height: ${(props: Props) => props.fixedHeight![3]};
            /* for smaller screens height is set based on fixedHeight prop */
            @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
                height: ${(props: Props) => props.fixedHeight![0]};
            }
            @media only screen and (min-width: ${variables.SCREEN_SIZE
                    .SM}) and (max-width: ${variables.SCREEN_SIZE.MD}) {
                height: ${(props: Props) => props.fixedHeight![1]};
            }
            @media only screen and (min-width: ${variables.SCREEN_SIZE
                    .MD}) and (max-width: ${variables.SCREEN_SIZE.LG}) {
                height: ${(props: Props) => props.fixedHeight![2]};
            }
        `}
`;

const StyledLink = styled(Link)`
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

const Heading = styled(H2)`
    text-align: center;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        /* make sure heading doesn't overflow over close button */
        padding-right: 20px;
        padding-left: 20px;
    }
`;

const Description = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-bottom: 10px;
    text-align: center;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;
`;

const BottomBar = styled.div`
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

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    heading?: React.ReactNode;
    description?: React.ReactNode;
    bottomBar?: React.ReactNode;
    cancelable?: boolean;
    size?: SIZE;
    useFixedWidth?: boolean;
    fixedWidth?: [string, string, string, string]; // [SM, MD, LG, XL]
    useFixedHeight?: boolean;
    fixedHeight?: [string, string, string, string]; // [SM, MD, LG, XL]
    padding?: string;
    paddingSmall?: string;
    onCancel?: () => void;
}

const Modal = ({
    children,
    heading,
    description,
    bottomBar,
    cancelable,
    onCancel,
    size = 'large',
    padding,
    paddingSmall,
    useFixedWidth = true,
    fixedWidth,
    useFixedHeight = false,
    fixedHeight,
    ...rest
}: Props) => {
    const escPressed = useKeyPress('Escape');
    const ref = useRef<HTMLDivElement>(null);

    if (cancelable && onCancel && escPressed) {
        onCancel();
    }

    useOnClickOutside(ref, () => {
        if (cancelable && onCancel) {
            onCancel();
        }
    });

    return (
        // <ModalOverlay>
        <ModalWindow
            ref={ref}
            size={size}
            padding={padding}
            paddingSmall={paddingSmall}
            useFixedWidth={useFixedWidth}
            fixedWidth={fixedWidth || getFixedWidth(size)}
            useFixedHeight={useFixedHeight}
            fixedHeight={fixedHeight || FIXED_HEIGHT}
            bottomBar={bottomBar}
            {...rest}
        >
            {heading && <Heading>{heading}</Heading>}
            {description && <Description>{description}</Description>}
            {cancelable && (
                <StyledLink onClick={onCancel}>
                    <Icon size={24} color={colors.BLACK0} icon="CROSS" />
                </StyledLink>
            )}
            <Content>{children}</Content>
            {bottomBar && <BottomBar>{bottomBar}</BottomBar>}
        </ModalWindow>
        // </ModalOverlay>
    );
};

export { Modal, ModalOverlay, Props as ModalProps };
