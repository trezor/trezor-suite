import styled, { keyframes } from 'styled-components';

import { palette } from '@trezor/theme';

const flow = keyframes`
    100% {
        stroke-dashoffset: 63;
    }
`;

// The edge waits at the first column while the batch arrives, then crosses all twelve.
const sweep = keyframes`
    22% {
        transform: none;
    }

    100% {
        transform: translateX(102px);
    }
`;

const arrive = keyframes`
    0% {
        scale: 0 1;
    }

    16% {
        scale: 1;
    }
`;

const burn = keyframes`
    0% {
        opacity: 1;
        stroke: var(--spark);
    }

    6% {
        stroke: var(--ember);
    }

    24%,
    100% {
        opacity: 0;
        transform: translateY(2px) scale(0.6);
        stroke: var(--ash);
    }
`;

const rise = keyframes`
    4% {
        opacity: 1;
    }

    35% {
        opacity: 0;
        transform: translate(-2px, -16px);
        fill: var(--ember);
    }
`;

const travel = keyframes`
    0% {
        stroke-dashoffset: 1;
        offset-distance: 100%;
    }
`;

const fadeIn = keyframes`
    0% {
        opacity: 0;
    }
`;

// Your transaction moves from the block on the screen to its slot in the tray.
const land = keyframes`
    100% {
        transform: translate(calc(min(var(--kept), 10) * 9px - 52.7px), 55.7px) scale(1.4);
    }
`;

// Scan events only set data attributes; every motion is a CSS animation keyed off them.
export const IllustrationSvg = styled.svg`
    /* No theme token is orange. */
    --ember: ${({ theme }) =>
        theme.mode === 'dark' ? palette.darkOrange600 : palette.lightOrange500};
    --card: ${({ theme }) => theme.surfaceFillRaised};
    --ink: ${({ theme }) => theme.contentPrimary};
    --screen: ${({ theme }) => theme.elementFillNeutralSofter};
    --cell: ${({ theme }) => theme.contentTertiary};
    --label: ${({ theme }) => theme.contentSecondary};
    --violet: ${({ theme }) => theme.contentAccentViolet};
    --keep: ${({ theme }) => theme.contentBrand};
    --spark: ${({ theme }) => theme.contentWarning};
    --ash: ${({ theme }) => theme.contentDisabled};
    --loop: 2.5s;

    /* The edges fade over 16% of the art, but on a narrow card only up to the circuit labels,
    which reach 150 units out from the laptop's centre. */
    --fade: min(16%, 50% - 150px);

    display: block;
    width: 100%;
    max-width: 760px;
    height: 214px;
    fill: none;
    stroke-linecap: round;
    mask-image: linear-gradient(
        90deg,
        transparent,
        #000 var(--fade) calc(100% - var(--fade)),
        transparent
    );

    /* A mempool filter stands for one unconfirmed transaction: round cells at a calmer pace. */
    &[data-stage='mempool'] {
        --loop: 9s;
        --cap: round;
        --dots: 9;
    }

    * {
        transform-box: fill-box;
        transform-origin: center;
    }

    text {
        stroke: var(--card);
        stroke-width: 4px;
        stroke-linejoin: round;
        paint-order: stroke;
        font-size: 12px;
        text-anchor: middle;
    }

    &[data-still] * {
        animation: none !important;
        transition: none !important;
    }

    /* Filters stream in while they download; the mempool subscription keeps it going. */
    .stream {
        stroke-opacity: 0.55;
        stroke-dasharray: 0 var(--dots, 7);
        animation: ${flow} 3.5s linear infinite;
    }

    &[data-stage='block'][data-activity='scan'] .stream {
        stroke-opacity: 0.2;
        animation-play-state: paused;
    }

    /* One loop per batch: the filters arrive, the edge checks the columns one by one, and each
    checked column flares, turns to ash and is gone. The cut and the match step with the edge, so
    the scan always waits for a fetch on a column. */
    .batch {
        stroke: var(--cell);
        stroke-width: 6;
        stroke-dasharray: 0 8.5;
        stroke-linecap: var(--cap, square);
    }

    .unchecked,
    .edge-step {
        animation: ${sweep} var(--loop) steps(12, jump-end) infinite;
    }

    .edge {
        fill: var(--spark);
        stroke: none;
        animation: ${sweep} var(--loop) linear infinite;
    }

    .unchecked {
        transform-origin: left;
        animation-name: ${sweep}, ${arrive};
        animation-timing-function: steps(12, jump-end), steps(12, jump-start);
    }

    .burns g > * {
        opacity: 0;
        animation: ${burn} var(--loop) calc(var(--loop) * (0.285 + var(--c) * 0.065)) infinite;
    }

    .burns circle {
        fill: var(--spark);
        stroke: none;
        animation-name: ${rise};
    }

    /* The scan waits for the fetch, and the smoulder cools meanwhile. */
    &[data-open] .batch * {
        animation-play-state: paused;
    }

    &[data-open]:not([data-still]) .burns {
        opacity: 0.4;
        transition: opacity 0.45s;
    }

    &:is([data-still], [data-open]) .match,
    &:is([data-still], [data-result]) .packet,
    &[data-result] .block {
        display: inline;
    }

    /* The presented fetch: the circuit is drawn from the port outwards, then the packet comes back
    along it and in through the port. */
    .circuit {
        animation: ${travel} 0.7s ease-in-out 0.2s both;
    }

    .hops,
    .circuit-label {
        animation: ${fadeIn} 0.3s 0.5s both;
    }

    &[data-result] .lit {
        animation: ${fadeIn} 0.6s 1.1s reverse forwards;
    }

    &[data-result] .packet {
        animation: ${travel} 1.1s ease-in-out both;
    }

    /* The block opens on the screen and burns down to your transaction, which moves to the tray.
    A chance match burns whole. Someone else's unconfirmed transaction isn't added, nor burned. */
    &[data-result] .block {
        animation: ${fadeIn} 0.2s 1.1s backwards;
    }

    &[data-result] .block > * {
        animation: ${burn} 2s calc(1.5s + var(--i, 0) * 70ms) forwards;
    }

    &[data-result='keep'] .mine {
        stroke: var(--keep);
        animation: ${land} 0.5s 2.1s ease-in-out both;
    }

    &[data-lit='mempool'] .block > :not(.mine) {
        display: none;
    }

    &[data-lit='mempool'][data-result='burn'] .mine {
        animation: ${fadeIn} 0.5s 1.8s reverse forwards;
    }

    /* A dot shows once your transaction has landed. The tray never burns. */
    .tray circle {
        fill-opacity: clamp(0, var(--kept) - var(--i), 1);
        transition: fill-opacity 0.3s var(--landing, 0s);
    }

    &[data-result='keep'] {
        --landing: 2.6s;
    }

    /* Nothing is checked or burned before the stage's first batch, and the loop starts with it. */
    &:not([data-still], [data-scanning]) .batch * {
        visibility: hidden;
        animation: none;
    }

    /* The reduced-motion still is a diagram: download, check, discard or keep. */
    &[data-still] :is(.unchecked, .edge-step, .edge) {
        transform: translateX(51px);
    }

    &[data-still] .burns > :nth-child(-n + 6) > * {
        opacity: calc(1 - (5 - var(--c)) * 0.4);
    }

    &[data-still] .burns circle {
        transform: translateY(calc(var(--c) * 4px - 26px));
    }

    &[data-still] .packet {
        offset-distance: 46%;
    }
`;
