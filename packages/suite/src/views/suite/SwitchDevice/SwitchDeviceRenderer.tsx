import { ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import { ModalProps } from '@trezor/components';
import { useModalTarget } from 'src/support/suite/ModalContext';
import { SwitchDeviceModal } from './SwitchDeviceModal';
import { ModalEnvironment } from 'src/components/suite/modals/ModalEnvironment';

export const SwitchDeviceRenderer = ({
    headerComponent,
    isCancelable,
    onCancel,
    isAnimationEnabled = false,
    ...rest
}: ModalProps & { isAnimationEnabled?: boolean }): ReactPortal | null => {
    const modalTarget = useModalTarget();

    if (!modalTarget) return null;

    const modal = (
        <ModalEnvironment
            onClickBackdrop={isCancelable ? onCancel : undefined}
            alignment={{ x: 'left', y: 'top' }}
        >
            <SwitchDeviceModal
                isAnimationEnabled={isAnimationEnabled}
                onCancel={onCancel}
                {...rest}
            />
        </ModalEnvironment>
    );

    return createPortal(modal, modalTarget);
};
