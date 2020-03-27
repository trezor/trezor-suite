import * as React from 'react';
import styled from 'styled-components';
import { useKeyPress, useOnClickOutside } from '../../utils/hooks';

import { Link } from '../typography/Link';
import { Icon } from '../Icon';
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
`;

const StyledLink = styled(Link)`
    display: flex;
    align-items: center;
    position: absolute;
    right: 0;
    top: 0;
    margin: 10px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.BLACK25};

    :hover {
        text-decoration: none;
        color: ${colors.BLACK0};
    }
`;

const StyledIcon = styled(Icon)`
    padding: 20px 14px;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    cancelable?: boolean;
    cancelText?: string;
    padding?: string;
    onCancel?: () => void;
}

const Modal = ({
    children,
    cancelable,
    cancelText,
    onCancel,
    padding = '10px',
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
        <ModalContainer {...rest}>
            <ModalWindow ref={ref} padding={padding}>
                {cancelable && (
                    <StyledLink onClick={onCancel}>
                        {cancelText || ''}
                        <StyledIcon size={16} color={colors.BLACK25} icon="CROSS" />
                    </StyledLink>
                )}
                {children}
            </ModalWindow>
        </ModalContainer>
    );
};

export { Modal, Props as ModalProps };
