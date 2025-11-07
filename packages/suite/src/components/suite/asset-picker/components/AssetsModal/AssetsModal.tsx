import { ReactNode } from 'react';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Modal, ModalSize } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

interface AssetsModalProps {
    children: ReactNode;
    heading: ExtendedMessageDescriptor;
    description?: ExtendedMessageDescriptor;
    onClose: () => void;
    size?: ModalSize;
}

export function AssetsModal({
    children,
    heading,
    description,
    onClose,
    size = 'small',
}: AssetsModalProps) {
    return (
        <Modal
            heading={<Translation {...heading} />}
            description={description ? <Translation {...description} /> : undefined}
            onCancel={onClose}
            size={size}
            height="unset"
        >
            {children}
        </Modal>
    );
}
