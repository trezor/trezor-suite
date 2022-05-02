import React, { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Modal, ModalProps, Icon, colors } from '@trezor/components';
import { useGuide } from '@guide-hooks';
import { useLayoutSize } from '@suite-hooks/useLayoutSize';
import { useModalTarget } from '@suite-support/ModalContext';
import { ModalEnvironment } from './ModalEnvironment';

export const DefaultRenderer = ({
    headerComponents = [],
    isCancelable,
    onCancel,
    ...rest
}: ModalProps) => {
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

    return ReactDOM.createPortal(modal, modalTarget);
};
