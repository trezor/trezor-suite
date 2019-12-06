import * as React from 'react';
import styled from 'styled-components';
import { useKeyPress } from '../../utils/hooks';

import { Link } from '../Link';
import { Icon } from '../Icon';
import { colors, variables } from '../../config';

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

const ModalWindow = styled.div`
    margin: auto;
    position: relative;
    border-radius: 4px;
    background-color: ${colors.WHITE};
    box-shadow: 0 10px 60px 0 ${colors.BLACK25};
    text-align: center;
`;

const StyledLink = styled(Link)`
    display: flex;
    align-items: center;
    position: absolute;
    right: 0;
    top: 0;
    padding: 18px;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.NORMAL};
    color: ${colors.BLACK25};

    :hover {
        text-decoration: none;
        color: ${colors.BLACK0};
    }
`;

const StyledIcon = styled(Icon)`
    margin-left: 4px;
`;

interface Props {
    children: React.ReactNode;
    cancelable?: boolean;
    cancelText?: string;
    onCancel?: () => void;
}

const Modal = ({ children, cancelable, cancelText, onCancel }: Props) => {
    const escPressed = useKeyPress('Escape');

    if (cancelable && onCancel && escPressed) {
        onCancel();
    }

    return (
        <ModalContainer>
            <ModalWindow>
                {children}
                {cancelable && (
                    <StyledLink onClick={onCancel}>
                        {cancelText}
                        <StyledIcon size={8} color={colors.BLACK25} icon="CROSS" />
                    </StyledLink>
                )}
            </ModalWindow>
        </ModalContainer>
    );
};

export { Modal, Props as ModalProps };
