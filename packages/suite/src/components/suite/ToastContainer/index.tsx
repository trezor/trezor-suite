import React from 'react';
import styled from 'styled-components';
import { ToastContainer as BaseToastContainer } from 'react-toastify';
import { colors } from '@trezor/components';

const StyledContainer = styled(BaseToastContainer)`
    /* Default classes used by react-toastify,
    this is the place if you want to override default styles */
    .Toastify__toast-container {
    }
    .Toastify__toast {
        border-radius: 4px;
        box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.19);
        color: ${colors.NEUE_TYPE_DARK_GREY};
        background: ${colors.NEUE_BG_WHITE};
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

const ToastContainer = () => {
    return <StyledContainer draggable={false} />;
};

export default ToastContainer;
