import React, { useMemo, ComponentType } from 'react';
import ReactDOM from 'react-dom';
import FocusLock from 'react-focus-lock';
import {
    Modal as TrezorModal,
    ModalProps as TrezorModalProps,
    Icon,
    Backdrop,
    colors,
} from '@trezor/components';
import { useGuide } from '@guide-hooks';
import { useLayoutSize } from '@suite-hooks/useLayoutSize';
import { useModalTarget } from '@suite-support/ModalContext';

export type ModalProps = TrezorModalProps & {
    render?: ComponentType<TrezorModalProps>;
};

const DefaultRenderer = ({
    headerComponents = [],
    isCancelable,
    onCancel,
    ...rest
}: TrezorModalProps) => {
    const { isGuideOpen, isGuideOnTop, openGuide } = useGuide();
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
        <FocusLock disabled={isGuideOpen && isGuideOnTop} group="overlay" autoFocus={false}>
            <Backdrop
                onClick={() => {
                    if (isCancelable) {
                        onCancel?.();
                    }
                }}
            >
                <TrezorModal
                    isCancelable={isCancelable}
                    onCancel={onCancel}
                    headerComponents={[
                        ...(isMobileLayout ? [GuideButton] : []),
                        ...headerComponents,
                    ]}
                    {...rest}
                />
            </Backdrop>
        </FocusLock>
    );

    return ReactDOM.createPortal(modal, modalTarget);
};

export const Modal = ({ render: View = DefaultRenderer, ...props }: ModalProps) => (
    <View {...props} />
);

Modal.Header = TrezorModal.Header;
Modal.Body = TrezorModal.Body;
Modal.Description = TrezorModal.Description;
Modal.Content = TrezorModal.Content;
Modal.BottomBar = TrezorModal.BottomBar;
