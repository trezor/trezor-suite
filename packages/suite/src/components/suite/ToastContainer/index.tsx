import React from 'react';
import styled from 'styled-components';
import { ToastContainer as BaseToastContainer, Slide } from 'react-toastify';

// A set of required styles copied from 'react-toastify/dist/ReactToastify.css'
// Note: lib styles are ready only for a current setup, if you want to change e.g. transition, copy additional styles
const StyledContainer = styled(BaseToastContainer)`
    /* stylelint-disable no-duplicate-selectors */
    & {
        min-width: 330px;
        max-width: 450px;
        z-index: 10002;
        position: fixed;
        padding: 4px;
        box-sizing: border-box;
        border-radius: 8px;
        top: 11px;
        right: 11px;

        @media only screen and (max-width: 480px) {
            width: calc(100vw - 12px);
            padding: 0;
            left: 0;
            margin: 0 6px;
            top: 4px;
            transform: translateX(0);
        }
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
        position: relative;
        min-height: 50px;
        box-sizing: border-box;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        max-height: 800px;
        overflow: hidden;
        word-break: break-all;
    }

    .Toastify__toast-body {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        margin: 0;
    }

    .Toastify__toast-body > div:last-child {
        flex: 1;
        height: 100%;
    }

    .Toastify--animate {
        animation-fill-mode: both;
        animation-duration: 0.7s;
    }

    @media only screen and (max-width: 480px) {
        .Toastify__toast {
            margin-bottom: 0;
            border-radius: 0;
        }
    }

    @keyframes Toastify__slideInRight {
        from {
            transform: translate3d(110%, 0, 0);
            visibility: visible;
        }
        to {
            transform: translate3d(0, 0, 0);
        }
    }

    @keyframes Toastify__slideOutRight {
        from {
            transform: translate3d(0, 0, 0);
        }
        to {
            visibility: hidden;
            transform: translate3d(110%, 0, 0);
        }
    }

    .Toastify__slide-enter--top-right {
        animation-name: Toastify__slideInRight;
    }

    .Toastify__slide-exit--top-right {
        animation-name: Toastify__slideOutRight;
    }

    @keyframes Toastify__trackProgress {
        0% {
            transform: scaleX(1);
        }
        100% {
            transform: scaleX(0);
        }
    }
    .Toastify__progress-bar--animated {
        animation: Toastify__trackProgress linear 1 forwards;
    }
`;

const ToastContainer = () => (
    <StyledContainer
        draggable={false}
        closeButton={false}
        hideProgressBar
        closeOnClick={false}
        position="top-right"
        transition={Slide}
    />
);

export default ToastContainer;
