import * as React from 'react';

import styled, { css } from 'styled-components';
import colors from 'config/colors';
import { FADE_IN } from 'config/animations';

import PropTypes from 'prop-types';

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

// modal container component
const Modal = (props) => {
    const { modal } = props;

    return (
        <ModalContainer css={css`animation: ${FADE_IN} 0.3s;`}>
            <ModalWindow>
                { modal.content }
            </ModalWindow>
        </ModalContainer>
    );
};

Modal.propTypes = {
    modal: PropTypes.object,
};

export default Modal;
