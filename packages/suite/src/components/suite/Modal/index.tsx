import React from 'react';
import { Modal as TrezorModal, ModalProps } from '@trezor/components';
import { DESKTOP_WRAPPER_BORDER_WIDTH } from '@suite-constants/layout';
import { isDesktop, isMac } from '@suite-utils/env';

const Modal = (props: ModalProps) => (
    <TrezorModal
        {...props}
        desktopBorder={isDesktop() && !isMac() ? DESKTOP_WRAPPER_BORDER_WIDTH : undefined}
    />
);
export { Modal };
export type { ModalProps };
