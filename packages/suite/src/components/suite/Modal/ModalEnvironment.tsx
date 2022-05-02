import React from 'react';
import FocusLock from 'react-focus-lock';
import { Backdrop } from '@trezor/components';
import { useGuide } from '@guide-hooks';

type ModalEnvironmentProps = {
    onClickBackdrop?: () => void;
    children: React.ReactNode;
};

export const ModalEnvironment = ({ onClickBackdrop, children }: ModalEnvironmentProps) => {
    const { isGuideOpen, isGuideOnTop } = useGuide();
    return (
        <FocusLock disabled={isGuideOpen && isGuideOnTop} group="overlay" autoFocus={false}>
            <Backdrop onClick={() => onClickBackdrop?.()}>{children}</Backdrop>
        </FocusLock>
    );
};
