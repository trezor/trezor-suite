import React, { useMemo, ComponentType } from 'react';
import styled from 'styled-components';
import FocusLock from 'react-focus-lock';
import {
    Modal as TrezorModal,
    ModalProps as TrezorModalProps,
    Icon,
    Backdrop,
    colors,
    variables,
} from '@trezor/components';
import { useGuide } from '@guide-hooks';
import { useLayoutSize } from '@suite-hooks/useLayoutSize';

const GuideBackdrop = styled(Backdrop)<{ guideOpen: boolean }>`
    transition: all 0.3s;
    right: ${({ guideOpen }) => (guideOpen ? variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH : '0')};

    & & {
        right: 0;
    }
`;

export type ModalProps = TrezorModalProps & {
    render?: ComponentType<TrezorModalProps>;
};

const DefaultRenderer = ({
    headerComponents = [],
    isCancelable,
    onCancel,
    ...rest
}: TrezorModalProps) => {
    const { isGuideOpen, isModalOpen, isGuideOnTop, openGuide } = useGuide();
    const { isMobileLayout } = useLayoutSize();

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

    return (
        <GuideBackdrop
            guideOpen={isGuideOpen && isModalOpen && !isGuideOnTop}
            onClick={() => {
                if (isCancelable) {
                    onCancel?.();
                }
            }}
        >
            <TrezorModal
                isCancelable={isCancelable}
                onCancel={onCancel}
                headerComponents={[...(isMobileLayout ? [GuideButton] : []), ...headerComponents]}
                {...rest}
            />
        </GuideBackdrop>
    );
};

export const Modal = ({ render: View = DefaultRenderer, ...props }: ModalProps) => {
    const { isGuideOpen, isGuideOnTop } = useGuide();

    return (
        <FocusLock disabled={isGuideOpen && isGuideOnTop} group="overlay" autoFocus={false}>
            <View {...props} />
        </FocusLock>
    );
};

Modal.HeaderBar = TrezorModal.HeaderBar;
Modal.Body = TrezorModal.Body;
Modal.Description = TrezorModal.Description;
Modal.Content = TrezorModal.Content;
Modal.BottomBar = TrezorModal.BottomBar;
