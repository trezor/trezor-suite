import { Slide, ToastContainer } from 'react-toastify';

import styled from 'styled-components';

import { spacingsPx, zIndices } from '@trezor/theme';

import { HEADER_HEIGHT } from 'src/constants/suite/layout';

const StyledToastContainer = styled(ToastContainer)`
    --toastify-font-family: var(--font-sans);
    --toastify-z-index: ${zIndices.toast};
    --toastify-toast-top: calc(${HEADER_HEIGHT} + ${spacingsPx.md});
    --toastify-toast-right: ${spacingsPx.md};
    --toastify-toast-bd-radius: 0;
    --toastify-toast-shadow: none;
    --toastify-toast-padding: 0;
    --toastify-toast-height: auto;
    --toastify-toast-min-height: 0;
    --toastify-toast-width: auto;
    --toastify-toast-min-width: 0;
    --toastify-color-light: transparent;
    --toastify-color-dark: transparent;

    /**
     * Layout fallback:
     * In some environments the default Toastify CSS may not be injected/loaded,
     * which makes the container render in normal document flow (ending up at 0,0).
     * We enforce fixed positioning for the top-right container to keep behavior consistent.
     */
    position: fixed;
    z-index: var(--toastify-z-index);

    /* stylelint-disable selector-class-pattern */
    &.Toastify__toast-container--top-right {
        top: var(--toastify-toast-top);
        right: var(--toastify-toast-right);
    }
    /* stylelint-enable selector-class-pattern */
`;

export const ToasterProvider = () => (
    <StyledToastContainer
        toastStyle={{
            margin: 0,
            marginBottom: spacingsPx.sm,
            padding: 0,
            borderRadius: 0,
            boxShadow: 'none',
            minHeight: 0,
            minWidth: 0,
            maxWidth: '430px',
            background: 'none',
        }}
        draggable={false}
        closeButton={false}
        hideProgressBar
        position="top-right"
        transition={Slide}
    />
);
