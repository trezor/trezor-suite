import { ReactNode } from 'react';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Modal, ModalWidth } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

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
