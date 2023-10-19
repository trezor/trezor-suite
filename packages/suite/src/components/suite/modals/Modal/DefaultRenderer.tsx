import { useMemo, ReactPortal } from 'react';
import { createPortal } from 'react-dom';
import { Modal, ModalProps, Icon, colors } from '@trezor/components';
import { useGuide } from 'src/hooks/guide';
import { useLayoutSize } from 'src/hooks/suite/useLayoutSize';
import { useModalTarget } from 'src/support/suite/ModalContext';
import { ModalEnvironment } from '../ModalEnvironment';

export const DefaultRenderer = ({
    headerComponents = [],
    isCancelable,
    onCancel,
    ...rest
}: ModalProps): ReactPortal | null => {
    const { openGuide } = useGuide();
    const { isMobileLayout } = useLayoutSize();
    const modalTarget = useModalTarget();

    const GuideButton = useMemo(
        () => (
            <Icon
                key="guide-button"
                icon="LIGHTBULB"
                size={20}
                hoverColor={colors.TYPE_ORANGE}
                onClick={openGuide}
            />
        ),
        [openGuide],
    );

    if (!modalTarget) return null;

    const modal = (
        <ModalEnvironment onClickBackdrop={isCancelable ? onCancel : undefined}>
            <Modal
                isCancelable={isCancelable}
                onCancel={onCancel}
                headerComponents={[...(isMobileLayout ? [GuideButton] : []), ...headerComponents]}
                {...rest}
            />
        </ModalEnvironment>
    );

    return createPortal(modal, modalTarget);
};
