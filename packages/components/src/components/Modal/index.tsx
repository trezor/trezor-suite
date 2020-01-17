import * as React from 'react';
import styled from 'styled-components';
import { useKeyPress } from '../../utils/hooks';

import { Link } from '../Link';
import { Icon } from '../Icon';
import colors from '../../config/colors';

const ModalContainer = styled.div`
    position: fixed;
    z-index: 10000;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    padding: 20px;
`;

const ModalWindow = styled.div`
    margin: auto;
    position: relative;
    border-radius: 4px;
    background-color: ${colors.WHITE};
    text-align: center;
`;

const StyledLink = styled(Link)`
    position: absolute;
    right: 0;
    top: 0;
    opacity: 0.5;
    padding: 20px;

    :hover {
        opacity: 1;
    }
`;

interface Props {
    children: React.ReactNode;
    cancelable?: boolean;
    onCancel?: () => void;
}

const Modal = ({ children, cancelable, onCancel }: Props) => {
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
                        <Icon
                            size={14}
                            color={colors.TEXT_SECONDARY}
                            icon="CLOSE"
                            data-test="@modal/close"
                        />
                    </StyledLink>
                )}
            </ModalWindow>
        </ModalContainer>
    );
};

export { Modal, Props as ModalProps };
