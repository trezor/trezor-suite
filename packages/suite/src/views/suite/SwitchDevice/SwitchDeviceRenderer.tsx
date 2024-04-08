import { ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import { ModalProps } from '@trezor/components';
// import { useGuide } from 'src/hooks/guide';
// import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { useModalTarget } from 'src/support/suite/ModalContext';
import { SwitchDeviceModal } from './SwitchDeviceModal';
import { ModalEnvironment } from 'src/components/suite/modals/ModalEnvironment';

export const SwitchDeviceRenderer = ({
    headerComponent,
    isCancelable,
    onCancel,
    ...rest
}: ModalProps): ReactPortal | null => {
    // const { openGuide } = useGuide();
    // const { isMobileLayout } = useLayoutSize();
    const modalTarget = useModalTarget();

    if (!modalTarget) return null;

    const modal = (
        <ModalEnvironment
            onClickBackdrop={isCancelable ? onCancel : undefined}
            alignment={{ x: 'left', y: 'top' }}
        >
            <SwitchDeviceModal {...rest} />
        </ModalEnvironment>
    );

    return createPortal(modal, modalTarget);
};
