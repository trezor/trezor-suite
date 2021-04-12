import React from 'react';
import styled from 'styled-components';
import { ToastContainer as BaseToastContainer } from 'react-toastify';

const StyledContainer = styled(BaseToastContainer)`
    /* Default classes used by react-toastify,
    this is the place if you want to override default styles */
    /* stylelint-disable no-duplicate-selectors */
    & {
        min-width: 330px;
        max-width: 450px;

        /* set correct position for top-right variant */
        top: 90px;
        right: 50px;
    }
    /* stylelint-enable no-duplicate-selectors */
    .Toastify__toast {
        border-radius: 4px;
        box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.19);
        color: ${props => props.theme.TYPE_DARK_GREY};
        background: ${props => props.theme.BG_WHITE};
        padding: 0px;
        font-family: 'TT Hoves', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue',
            Arial, sans-serif;
    }
    .Toastify__toast--default {
    }
    .Toastify__toast--error {
    }
    .Toastify__toast--warning {
    }
    .Toastify__toast--success {
    }
    .Toastify__toast-body {
        margin: 0;
    }
    .Toastify__progress-bar {
    }
`;

const ToastContainer = () => (
    <StyledContainer
        draggable={false}
        closeButton={false}
        hideProgressBar
        closeOnClick={false}
        position="top-right"
    />
);

export default ToastContainer;
