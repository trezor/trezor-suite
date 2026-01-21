import { Slide, ToastContainer } from 'react-toastify/unstyled';
import styled from 'styled-components';

import { spacingsPx, zIndices } from '@trezor/theme';

import { HEADER_HEIGHT } from 'src/constants/suite/layout';

import { ReactToastifyStyles } from './ReactToastifyStyles';

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
`;

export const ToasterProvider = () => (
    <ReactToastifyStyles>
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
    </ReactToastifyStyles>
);
