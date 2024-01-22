import { ComponentType, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import TrezorConnect from '@trezor/connect';
import {
    ConfirmOnDevice,
    Modal as TrezorModal,
    ModalProps as TrezorModalProps,
} from '@trezor/components';
import { Translation } from 'src/components/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'src/hooks/suite/useSelector';
import messages from 'src/support/messages';
import { useDevice } from 'src/hooks/suite';
import { useModalTarget } from 'src/support/suite/ModalContext';
import { ModalEnvironment } from '../../ModalEnvironment';
import { Modal } from '../../Modal/Modal';

const StyledTrezorModal = styled(TrezorModal)`
    ${Modal.Header} {
        padding: 24px 24px 0;
    }

    ${Modal.Body} {
        margin-top: ${({ headerComponent }) => !headerComponent && '60px'};
        padding: 24px;
    }
`;

export interface DevicePromptModalProps {
    isPillShown?: boolean;
    isConfirmed?: boolean;
    pillTitle?: string;
    renderer?: ComponentType<TrezorModalProps>;
    isAbortable?: boolean;
    onAbort?: () => void;
    className?: string;
    children?: ReactNode;
    'data-test'?: string;
}

const DevicePromptModalRenderer = ({
    isPillShown = true,
    isConfirmed,
    pillTitle,
    isAbortable = true,
    onAbort,
    ...rest
}: DevicePromptModalProps) => {
    const { device } = useDevice();
    const modalTarget = useModalTarget();

    // duplicated because headerComponent should receive undefined if isAbortable === false
    const isActionAbortable = useSelector(selectIsActionAbortable) || isAbortable;

    const intl = useIntl();

    if (!onAbort) {
        onAbort = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
    }

    if (!modalTarget) return null;

    const deviceModelInternal = device?.features?.internal_model;

    const modalComponent = (
        <ModalEnvironment>
            <StyledTrezorModal
                modalPrompt={
                    isPillShown && (
                        <ConfirmOnDevice
                            title={pillTitle || <Translation id="TR_CONFIRM_ON_TREZOR" />}
                            deviceModelInternal={deviceModelInternal}
                            deviceUnitColor={device?.features?.unit_color}
                            isConfirmed={isConfirmed}
                            onCancel={isActionAbortable ? onAbort : undefined}
                        />
                    )
                }
                {...rest}
            />
        </ModalEnvironment>
    );

    return createPortal(modalComponent, modalTarget);
};

export const DevicePromptModal = (props: DevicePromptModalProps) => (
    <Modal {...props} renderer={props.renderer || DevicePromptModalRenderer} />
);
