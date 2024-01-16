import { DialogModal as BaseDialogModal, DialogModalProps } from '@trezor/components';
import { ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import { useModalTarget } from 'src/support/suite/ModalContext';
import { ModalEnvironment } from '../ModalEnvironment';
import { ModalProps, Modal } from './Modal';

export const DialogRenderer = ({
    headerComponent,
    isCancelable,
    onCancel,
    ...rest
}: ModalProps): ReactPortal | null => {
    const modalTarget = useModalTarget();

    if (!modalTarget) return null;

    const modal = (
        <ModalEnvironment onClickBackdrop={isCancelable ? onCancel : undefined}>
            <BaseDialogModal isCancelable={isCancelable} onCancel={onCancel} {...rest} />
        </ModalEnvironment>
    );

    return createPortal(modal, modalTarget);
};

export const DialogModal = (props: DialogModalProps) => (
    <Modal {...props} renderer={DialogRenderer} />
);
