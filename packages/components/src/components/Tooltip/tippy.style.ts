import { css } from 'styled-components';

// imported from 'tippy.js/dist/tippy.css';
export const tippy = css`
    .tippy-tooltip[data-animation='fade'][data-state='hidden'] {
        opacity: 0;
    }

    .tippy-iOS {
        cursor: pointer !important;
        -webkit-tap-highlight-color: transparent;
    }

    .tippy-popper {
        pointer-events: none;
        max-width: calc(100vw - 10px);
        transition-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);
        transition-property: transform;
    }

    .tippy-tooltip {
        position: relative;
        color: #fff;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.4;
        background-color: #333;
        transition-property: visibility, opacity, transform;
        outline: 0;
    }

    .tippy-tooltip[data-interactive][data-state='visible'] {
        pointer-events: auto;
    }

    .tippy-tooltip[data-inertia][data-state='visible'] {
        transition-timing-function: cubic-bezier(0.54, 1.5, 0.38, 1.11);
    }

    .tippy-arrow {
        position: absolute;
        border-color: transparent;
        border-style: solid;
    }

    .tippy-content {
        padding: 5px 9px;
    }

    .tippy-tooltip[data-placement^='top'] > .tippy-arrow {
        border-width: 8px 8px 0;
        border-top-color: red;
        margin: 0 3px;
        transform-origin: 50% 0;
        bottom: -7px;
    }

    .tippy-tooltip[data-placement^='bottom'] > .tippy-arrow {
        border-width: 0 8px 8px;
        border-bottom-color: #333;
        margin: 0 3px;
        transform-origin: 50% 7px;
        top: -7px;
    }

    .tippy-tooltip[data-placement^='left'] > .tippy-arrow {
        border-width: 8px 0 8px 8px;
        border-left-color: #333;
        margin: 3px 0;
        transform-origin: 0 50%;
        right: -7px;
    }

    .tippy-tooltip[data-placement^='right'] > .tippy-arrow {
        border-width: 8px 8px 8px 0;
        border-right-color: #333;
        margin: 3px 0;
        transform-origin: 7px 50%;
        left: -7px;
    }

    .tippy-tooltip[data-animation='scale'][data-placement^='top'] {
        transform-origin: bottom;
    }

    .tippy-tooltip[data-animation='scale'][data-placement^='bottom'] {
        transform-origin: top;
    }

    .tippy-tooltip[data-animation='scale'][data-placement^='left'] {
        transform-origin: right;
    }

    .tippy-tooltip[data-animation='scale'][data-placement^='right'] {
        transform-origin: left;
    }

    .tippy-tooltip[data-animation='scale'][data-state='hidden'] {
        transform: scale(0.5);
        opacity: 0;
    }
`;
