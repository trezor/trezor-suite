import React from 'react';
import { Modal as TrezorModal, ModalProps } from '@trezor/components';
import { useSelector } from '@suite/hooks/suite';

const Modal = (props: ModalProps) => {
    const { guideOpen } = useSelector(state => ({
        guideOpen: state.guide.open,
    }));
    return <TrezorModal guideOpen={guideOpen} {...props} />;
};
export { Modal };
export type { ModalProps };
