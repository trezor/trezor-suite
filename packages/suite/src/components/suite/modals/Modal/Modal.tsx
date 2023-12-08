import { ComponentType } from 'react';
import { Modal as TrezorModal, ModalProps as TrezorModalProps } from '@trezor/components';
import { DefaultRenderer } from './DefaultRenderer';

export type ModalProps = TrezorModalProps & {
    renderer?: ComponentType<TrezorModalProps>;
};

export const Modal = ({ renderer: View = DefaultRenderer, ...props }: ModalProps) => (
    <View {...props} />
);

Modal.Header = TrezorModal.Header;
Modal.Body = TrezorModal.Body;
Modal.Description = TrezorModal.Description;
Modal.Content = TrezorModal.Content;
Modal.BottomBar = TrezorModal.BottomBar;
Modal.closeIconWidth = TrezorModal.closeIconWidth;
