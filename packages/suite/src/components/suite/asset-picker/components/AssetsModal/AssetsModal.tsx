import { ReactNode } from 'react';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Modal } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

interface AssetsModalProps {
    children: ReactNode;
    heading: ExtendedMessageDescriptor;
    description?: ExtendedMessageDescriptor;
    onClose: () => void;
}

export function AssetsModal({ children, heading, description, onClose }: AssetsModalProps) {
    return (
        <Modal
            heading={<Translation {...heading} />}
            description={description ? <Translation {...description} /> : undefined}
            onCancel={onClose}
            size="little"
            height="unset"
        >
            {children}
        </Modal>
    );
}
