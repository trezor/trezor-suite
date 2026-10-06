import { Modal, type ModalProps } from '@trezor/components';

type AssetsModalProps = Required<Pick<ModalProps, 'children' | 'heading'>> &
    Pick<
        ModalProps,
        | 'description'
        | 'onBackClick'
        | 'width'
        | 'height'
        | 'maxHeight'
        | 'padding'
        | 'bottomContent'
        | 'shadowBottom'
        | 'data-testid'
    > & {
        onClose: NonNullable<ModalProps['onCancel']>;
    };

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
