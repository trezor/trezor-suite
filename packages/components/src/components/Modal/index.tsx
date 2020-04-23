import * as React from 'react';
import styled, { css } from 'styled-components';
import { useKeyPress, useOnClickOutside } from '../../utils/hooks';

import { Link } from '../typography/Link';
import { Icon } from '../Icon';
import { H2 } from '../typography/Heading';
import { colors, variables } from '../../config';
import { useRef } from 'react';

const ModalContainer = styled.div`
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
    justify-content: center;
    margin: auto;
    position: relative;
    border-radius: 6px;
    background-color: ${colors.WHITE};
    box-shadow: 0 10px 60px 0 ${colors.BLACK25};
    text-align: center;
    padding: ${props => props.padding};
    overflow-x: hidden; /* retains border-radius when using background in child component */
    max-height: 90vh;
    max-width: 90vh;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: ${props => props.paddingSmall};
    }

    ${props =>
        props.useFixedWidth &&
        props.fixedWidth &&
        css`
            @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
                max-width: ${(props: Props) => props.fixedWidth![0]};
            }
            @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
                max-width: ${(props: Props) => props.fixedWidth![1]};
            }
            @media only screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
                max-width: ${(props: Props) => props.fixedWidth![2]};
            }
            @media only screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
                max-width: ${(props: Props) => props.fixedWidth![3]};
            }
        `}

    ${props =>
        props.useFixedHeight &&
        props.fixedHeight &&
        css`
            @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
                max-height: ${(props: Props) => props.fixedHeight![0]};
            }
            @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
                max-height: ${(props: Props) => props.fixedHeight![1]};
            }
            @media only screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
                max-height: ${(props: Props) => props.fixedHeight![2]};
            }
            @media only screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
                max-height: ${(props: Props) => props.fixedHeight![3]};
            }
        `}
`;

const StyledLink = styled(Link)`
    display: flex;
    align-items: center;
    position: absolute;
    right: 0;
    top: 0;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK25};

    :hover {
        text-decoration: none;
        color: ${colors.BLACK0};
    }
`;

const Heading = styled(H2)``;

const Description = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-bottom: 10px;
`;

const Content = styled.div`
    display: flex;
    overflow-y: auto;
`;

const StyledIcon = styled(Icon)`
    padding: 20px 14px;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    heading?: React.ReactNode;
    description?: React.ReactNode;
    cancelable?: boolean;
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
    cancelable,
    onCancel,
    padding = '35px 40px',
    paddingSmall = '16px 8px',
    useFixedWidth = false,
    fixedWidth = ['90vw', '90vw', '720px', '720px'], // [SM, MD, LG, XL]
    useFixedHeight = false,
    fixedHeight = ['90vh', '90vh', '720px', '720px'], // [SM, MD, LG, XL]
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
        <ModalContainer>
            <ModalWindow
                ref={ref}
                padding={padding}
                paddingSmall={paddingSmall}
                useFixedWidth={useFixedWidth}
                fixedWidth={fixedWidth}
                useFixedHeight={useFixedHeight}
                fixedHeight={fixedHeight}
                {...rest}
            >
                {heading && <Heading>{heading}</Heading>}
                {description && <Description>{description}</Description>}
                {cancelable && (
                    <StyledLink onClick={onCancel}>
                        <StyledIcon size={24} color={colors.BLACK0} icon="CROSS" />
                    </StyledLink>
                )}
                <Content>{children}</Content>
            </ModalWindow>
        </ModalContainer>
    );
};

export { Modal, Props as ModalProps };
