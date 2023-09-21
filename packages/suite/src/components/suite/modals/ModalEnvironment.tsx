import { ReactNode } from 'react';
import FocusLock from 'react-focus-lock';
import { Backdrop } from '@trezor/components';

type ModalEnvironmentProps = {
    onClickBackdrop?: () => void;
    children: ReactNode;
};

export const ModalEnvironment = ({ onClickBackdrop, children }: ModalEnvironmentProps) => (
    <FocusLock autoFocus={false}>
        <Backdrop onClick={onClickBackdrop}>{children}</Backdrop>
    </FocusLock>
);
