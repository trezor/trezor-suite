import React from 'react';

import { Modal as TrezorModal, ModalProps } from '@trezor/components';
import { useGuide } from '@guide-hooks';

const Modal = (props: ModalProps) => {
    const { guideOpen, isModalOpen } = useGuide();

    return <TrezorModal guideOpen={guideOpen && isModalOpen} {...props} />;
};
export { Modal };
export type { ModalProps };
