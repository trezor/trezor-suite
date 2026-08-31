import { type ReactNode } from 'react';

import { Modal, type ModalProps, type ModalWidth, type Padding } from '@trezor/components';

interface AssetsModalProps {
    children: ReactNode;
    heading: ReactNode;
    description?: ReactNode;
    onClose: () => void;
    onBackClick?: () => void;
    width?: ModalWidth;
    height?: ModalProps['height'];
    maxHeight?: ModalProps['maxHeight'];
    padding?: Padding;
    bottomContent?: ReactNode;
    shadowBottom?: boolean;
    'data-testid'?: string;
}

export function AssetsModal({
    children,
    heading,
    description,
    onClose,
    onBackClick,
    width = 600,
    height,
    maxHeight,
    padding = { horizontal: 0, top: 16 },
    bottomContent,
    shadowBottom,
    'data-testid': dataTestId,
}: AssetsModalProps) {
    return (
        <Modal
            heading={heading}
            description={description}
            onCancel={onClose}
            onBackClick={onBackClick}
            width={width}
            height={height}
            maxHeight={maxHeight}
            padding={padding}
            bottomContent={bottomContent}
            shadowBottom={shadowBottom}
            data-testid={dataTestId}
        >
            {children}
        </Modal>
    );
}
