import { type ReactNode } from 'react';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { Modal, type ModalWidth } from '@trezor/components';

interface AssetsModalProps {
    children: ReactNode;
    heading: ExtendedMessageDescriptor;
    description?: ExtendedMessageDescriptor;
    onClose: () => void;
    width?: ModalWidth;
    bottomContent?: ReactNode;
}

export function AssetsModal({
    children,
    heading,
    description,
    onClose,
    width = 480,
    bottomContent,
}: AssetsModalProps) {
    return (
        <Modal
            heading={<Translation {...heading} />}
            description={description ? <Translation {...description} /> : undefined}
            onCancel={onClose}
            width={width}
            padding={{ horizontal: 0, top: 16 }}
            bottomContent={bottomContent}
        >
            {children}
        </Modal>
    );
}
