import React from 'react';

import styled from 'styled-components';

const StyledLoader = styled.div`
    .loader {
        position: relative;
        width: 130px;
        height: 130px;
        display: flex;
        justify-content: center;
        align-items: center;
        align-self: center;
        color: #757575;
    }
    .loader .circular {
        padding-top: 0px;
        width: 130px;
        height: 130px;
        animation: rotate 2s linear infinite;
        transform-origin: center center;
        position: absolute;
    }
    .loader .circular .route {
        stroke: #f2f2f2;
    }
    .loader .circular .path {
        stroke-dasharray: 1, 200;
        stroke-dashoffset: 0;
        animation: dash 1.5s ease-in-out infinite, color 6s ease-in-out infinite;
        stroke-linecap: round;
    }
    @media screen and (min-width: 768px) {
        .loader {
            width: 160px;
            height: 160px;
        }
        .loader .circular {
            width: 160px;
            height: 160px;
        }
    }
    @keyframes color {
        100%,
        0% {
            stroke: #01b757;
        }
        40% {
            stroke: #01b757;
        }
        66% {
            stroke: #00ab51;
        }
        80%,
        90% {
            stroke: #009546;
        }
    }
    @keyframes rotate {
        100% {
            transform: rotate(360deg);
        }
    }
    @keyframes dash {
        0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
        }
        50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35;
        }
        100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124;
        }
    }
`;

export const Loader = () => (
    <StyledLoader>
        <div className="loader">
            Loading...
            <svg className="circular" viewBox="25 25 50 50" preserveAspectRatio="xMidYMid">
                <circle
                    className="route"
                    cx="50"
                    cy="50"
                    r="20"
                    fill="none"
                    stroke=""
                    strokeWidth="1"
                    strokeMiterlimit="10"
                />
                <circle
                    className="path"
                    cx="50"
                    cy="50"
                    r="20"
                    fill="none"
                    strokeWidth="1"
                    strokeMiterlimit="10"
                />
            </svg>
        </div>
    </StyledLoader>
);
