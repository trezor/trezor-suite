import { colors } from '@trezor/components';
import { isDesktop } from '@suite-utils/env';
import { DESKTOP_TITLEBAR_HEIGHT } from '@suite-constants/layout';

const OFFSET_TOP = isDesktop() ? `calc(${DESKTOP_TITLEBAR_HEIGHT} + 1em)` : '1em';
export const notifications = `
    .Toastify__toast-container {
        z-index: 10001;
        position: fixed;
        padding: 4px;
        max-width: 800px;
        box-sizing: border-box;
        border-radius: 6px;
    }

    .Toastify__toast-container--top-left {
        top: ${OFFSET_TOP};
        left: 1em;
    }

    .Toastify__toast-container--top-center {
        top: ${OFFSET_TOP};
        left: 50%;
        margin-left: -160px;
    }

    .Toastify__toast-container--top-right {
        top: ${OFFSET_TOP};
        right: 1em;
    }

    .Toastify__toast-container--bottom-left {
        bottom: 1em;
        left: 1em;
    }

    .Toastify__toast-container--bottom-center {
        bottom: 1em;
        left: 0;
        right: 0;
        margin: 0px auto;
    }

    .Toastify__toast-container--bottom-right {
        bottom: 1em;
        right: 1em;
    }

    @media only screen and (max-width: 480px) {
        .Toastify__toast-container {
            width: 100vw;
            padding: 0;
            left: 0;
            margin: 0;
        }
        .Toastify__toast-container--top-left,
        .Toastify__toast-container--top-center,
        .Toastify__toast-container--top-right {
            top: 0;
        }
        .Toastify__toast-container--bottom-left,
        .Toastify__toast-container--bottom-center,
        .Toastify__toast-container--bottom-right {
            bottom: 0;
        }
        .Toastify__toast-container--rtl {
            right: 0;
            left: initial;
        }
    }

    .Toastify__toast {
        position: relative;
        background: ${colors.BG_WHITE};
        min-height: 50px;
        box-sizing: border-box;
        margin-bottom: 1rem;
        padding: 16px;
        border-radius: 6px;
        box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.1), 0 2px 15px 0 rgba(0, 0, 0, 0.05);
        display: flex;
        justify-content: space-between;
        max-height: 800px;
        overflow: hidden;
        font-family: sans-serif;
        direction: ltr;
        word-break: break-all;
    }

    .Toastify__toast--rtl {
        direction: rtl;
    }

    .Toastify__toast--default {
        background: ${colors.BG_LIGHT_GREY};
        color: ${colors.TYPE_WHITE};
    }

    .Toastify__toast--info {
        background: ${colors.BG_LIGHT_GREY};
    }

    .Toastify__toast--success {
        background: ${colors.BG_LIGHT_GREY};
    }

    .Toastify__toast--warning {
        background: ${colors.BG_LIGHT_GREY};
    }

    .Toastify__toast--error {
        background: ${colors.BG_LIGHT_GREY};
    }

    .Toastify__toast-body {
        margin: auto 0;
        flex: 1;
    }

    @media only screen and (max-width: 480px) {
        .Toastify__toast {
            margin-bottom: 0;
        }
    }

    .Toastify__close-button {
        color: #fff;
        display: none;
        font-weight: bold;
        font-size: 14px;
        background: transparent;
        outline: none;
        border: none;
        padding: 0;
        cursor: pointer;
        opacity: 0.7;
        transition: 0.3s ease;
        align-self: flex-start;
    }

    .Toastify__close-button--default {
        color: #000;
        opacity: 0.3;
    }

    .Toastify__close-button:hover,
    .Toastify__close-button:focus {
        opacity: 1;
    }

    @keyframes Toastify__trackProgress {
        0% {
            transform: scaleX(1);
        }
        100% {
            transform: scaleX(0);
        }
    }

    .Toastify__progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        z-index: 9999;
        opacity: 0.7;
        background-color: rgba(255, 255, 255, 0.7);
        transform-origin: left;
    }

    .Toastify__progress-bar--animated {
        animation: Toastify__trackProgress linear 1 forwards;
    }

    .Toastify__progress-bar--controlled {
        transition: transform 0.2s;
    }

    .Toastify__progress-bar--rtl {
        right: 0;
        left: initial;
        transform-origin: right;
    }

    .Toastify__progress-bar--default {
        background: ${colors.BG_WHITE};
    }

    @keyframes Toastify__bounceInRight {
        from,
        60%,
        75%,
        90%,
        to {
            animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        from {
            opacity: 0;
            transform: translate3d(3000px, 0, 0);
        }
        60% {
            opacity: 1;
            transform: translate3d(-25px, 0, 0);
        }
        75% {
            transform: translate3d(10px, 0, 0);
        }
        90% {
            transform: translate3d(-5px, 0, 0);
        }
        to {
            transform: none;
        }
    }

    @keyframes Toastify__bounceOutRight {
        20% {
            opacity: 1;
            transform: translate3d(-20px, 0, 0);
        }
        to {
            opacity: 0;
            transform: translate3d(2000px, 0, 0);
        }
    }

    @keyframes Toastify__bounceInLeft {
        from,
        60%,
        75%,
        90%,
        to {
            animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        0% {
            opacity: 0;
            transform: translate3d(-3000px, 0, 0);
        }
        60% {
            opacity: 1;
            transform: translate3d(25px, 0, 0);
        }
        75% {
            transform: translate3d(-10px, 0, 0);
        }
        90% {
            transform: translate3d(5px, 0, 0);
        }
        to {
            transform: none;
        }
    }

    @keyframes Toastify__bounceOutLeft {
        20% {
            opacity: 1;
            transform: translate3d(20px, 0, 0);
        }
        to {
            opacity: 0;
            transform: translate3d(-2000px, 0, 0);
        }
    }

    @keyframes Toastify__bounceInUp {
        from,
        60%,
        75%,
        90%,
        to {
            animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        from {
            opacity: 0;
            transform: translate3d(0, 3000px, 0);
        }
        60% {
            opacity: 1;
            transform: translate3d(0, -20px, 0);
        }
        75% {
            transform: translate3d(0, 10px, 0);
        }
        90% {
            transform: translate3d(0, -5px, 0);
        }
        to {
            transform: translate3d(0, 0, 0);
        }
    }

    @keyframes Toastify__bounceOutUp {
        20% {
            transform: translate3d(0, -10px, 0);
        }
        40%,
        45% {
            opacity: 1;
            transform: translate3d(0, 20px, 0);
        }
        to {
            opacity: 0;
            transform: translate3d(0, -2000px, 0);
        }
    }

    @keyframes Toastify__bounceInDown {
        from,
        60%,
        75%,
        90%,
        to {
            animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        0% {
            opacity: 0;
            transform: translate3d(0, -3000px, 0);
        }
        60% {
            opacity: 1;
            transform: translate3d(0, 25px, 0);
        }
        75% {
            transform: translate3d(0, -10px, 0);
        }
        90% {
            transform: translate3d(0, 5px, 0);
        }
        to {
            transform: none;
        }
    }

    @keyframes Toastify__bounceOutDown {
        20% {
            transform: translate3d(0, 10px, 0);
        }
        40%,
        45% {
            opacity: 1;
            transform: translate3d(0, -20px, 0);
        }
        to {
            opacity: 0;
            transform: translate3d(0, 2000px, 0);
        }
    }

    .Toastify__bounce-enter--top-left,
    .Toastify__bounce-enter--bottom-left {
        animation-name: Toastify__bounceInLeft;
    }

    .Toastify__bounce-enter--top-right,
    .Toastify__bounce-enter--bottom-right {
        animation-name: Toastify__bounceInRight;
    }

    .Toastify__bounce-enter--top-center {
        animation-name: Toastify__bounceInDown;
    }

    .Toastify__bounce-enter--bottom-center {
        animation-name: Toastify__bounceInUp;
    }

    .Toastify__bounce-exit--top-left,
    .Toastify__bounce-exit--bottom-left {
        animation-name: Toastify__bounceOutLeft;
    }

    .Toastify__bounce-exit--top-right,
    .Toastify__bounce-exit--bottom-right {
        animation-name: Toastify__bounceOutRight;
    }

    .Toastify__bounce-exit--top-center {
        animation-name: Toastify__bounceOutUp;
    }

    .Toastify__bounce-exit--bottom-center {
        animation-name: Toastify__bounceOutDown;
    }

    @keyframes Toastify__zoomIn {
        from {
            opacity: 0;
            transform: scale3d(0.3, 0.3, 0.3);
        }
        50% {
            opacity: 1;
        }
    }

    @keyframes Toastify__zoomOut {
        from {
            opacity: 1;
        }
        50% {
            opacity: 0;
            transform: scale3d(0.3, 0.3, 0.3);
        }
        to {
            opacity: 0;
        }
    }

    .Toastify__zoom-enter {
        animation-name: Toastify__zoomIn;
    }

    .Toastify__zoom-exit {
        animation-name: Toastify__zoomOut;
    }

    @keyframes Toastify__flipIn {
        from {
            transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
            animation-timing-function: ease-in;
            opacity: 0;
        }
        40% {
            transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
            animation-timing-function: ease-in;
        }
        60% {
            transform: perspective(400px) rotate3d(1, 0, 0, 10deg);
            opacity: 1;
        }
        80% {
            transform: perspective(400px) rotate3d(1, 0, 0, -5deg);
        }
        to {
            transform: perspective(400px);
        }
    }

    @keyframes Toastify__flipOut {
        from {
            transform: perspective(400px);
        }
        30% {
            transform: perspective(400px) rotate3d(1, 0, 0, -20deg);
            opacity: 1;
        }
        to {
            transform: perspective(400px) rotate3d(1, 0, 0, 90deg);
            opacity: 0;
        }
    }

    .Toastify__flip-enter {
        animation-name: Toastify__flipIn;
    }

    .Toastify__flip-exit {
        animation-name: Toastify__flipOut;
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

    @keyframes Toastify__slideInLeft {
        from {
            transform: translate3d(-110%, 0, 0);
            visibility: visible;
        }
        to {
            transform: translate3d(0, 0, 0);
        }
    }

    @keyframes Toastify__slideInUp {
        from {
            transform: translate3d(0, 110%, 0);
            visibility: visible;
        }
        to {
            transform: translate3d(0, 0, 0);
        }
    }

    @keyframes Toastify__slideInDown {
        from {
            transform: translate3d(0, -110%, 0);
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

    @keyframes Toastify__slideOutLeft {
        from {
            transform: translate3d(0, 0, 0);
        }
        to {
            visibility: hidden;
            transform: translate3d(-110%, 0, 0);
        }
    }

    @keyframes Toastify__slideOutDown {
        from {
            transform: translate3d(0, 0, 0);
        }
        to {
            visibility: hidden;
            transform: translate3d(0, 500px, 0);
        }
    }

    @keyframes Toastify__slideOutUp {
        from {
            transform: translate3d(0, 0, 0);
        }
        to {
            visibility: hidden;
            transform: translate3d(0, -500px, 0);
        }
    }

    .Toastify__slide-enter--top-left,
    .Toastify__slide-enter--bottom-left {
        animation-name: Toastify__slideInLeft;
    }

    .Toastify__slide-enter--top-right,
    .Toastify__slide-enter--bottom-right {
        animation-name: Toastify__slideInRight;
    }

    .Toastify__slide-enter--top-center {
        animation-name: Toastify__slideInDown;
    }

    .Toastify__slide-enter--bottom-center {
        animation-name: Toastify__slideInUp;
    }

    .Toastify__slide-exit--top-left,
    .Toastify__slide-exit--bottom-left {
        animation-name: Toastify__slideOutLeft;
    }

    .Toastify__slide-exit--top-right,
    .Toastify__slide-exit--bottom-right {
        animation-name: Toastify__slideOutRight;
    }

    .Toastify__slide-exit--top-center {
        animation-name: Toastify__slideOutUp;
    }

    .Toastify__slide-exit--bottom-center {
        animation-name: Toastify__slideOutDown;
    }
`;
