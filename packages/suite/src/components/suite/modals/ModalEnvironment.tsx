import { ReactNode } from 'react';
import FocusLock from 'react-focus-lock';

import { Backdrop, ModalAlignment } from '@trezor/components';

type ModalEnvironmentProps = {
    onClickBackdrop?: () => void;
    children: ReactNode;
    alignment?: ModalAlignment;
};

export const ModalEnvironment = ({
    onClickBackdrop,
    children,
    alignment,
}: ModalEnvironmentProps) => (
    <FocusLock autoFocus={false}>
        <Backdrop onClick={onClickBackdrop} alignment={alignment}>
            {children}
        </Backdrop>
    </FocusLock>
);
