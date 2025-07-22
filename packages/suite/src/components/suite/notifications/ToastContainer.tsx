import { ToastContainer as BaseToastContainer, Slide } from 'react-toastify';

import { spacings, spacingsPx, zIndices } from '@trezor/theme';

import { HEADER_HEIGHT_NUMERIC } from 'src/constants/suite/layout';

export const ToastContainer = () => (
    <BaseToastContainer
        pauseOnHover
        pauseOnFocusLoss
        draggable={false}
        closeButton={false}
        hideProgressBar
        position="top-right"
        transition={Slide}
        style={{
            position: 'fixed',
            top: HEADER_HEIGHT_NUMERIC + spacings.sm + 'px',
            right: spacingsPx.sm,
            zIndex: zIndices.tooltip,
        }}
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
    />
);
