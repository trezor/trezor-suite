import React, { ComponentType } from 'react';
import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import TrezorConnect from '@trezor/connect';
import {
    ConfirmOnDevice,
    Icon,
    useTheme,
    Modal as TrezorModal,
    ModalProps as TrezorModalProps,
    variables,
} from '@trezor/components';
import { Translation } from '..';
import { ModalEnvironment } from './ModalEnvironment';
import { useModalTarget } from 'src/support/suite/ModalContext';
import { Modal } from '.';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useIntl } from 'react-intl';
import messages from 'src/support/messages';
import { useDevice } from 'src/hooks/suite';

const StyledTrezorModal = styled(TrezorModal)`
    ${Modal.Header} {
        padding: 24px 24px 0;
    }

    ${Modal.Body} {
        margin-top: ${({ headerComponents }) => !headerComponents?.length && '60px'};
        padding: 24px;
    }
`;

const collapsedStyle = css`
    width: 32px;

    span {
        opacity: 0;
    }
`;

const expandedStyle = css`
    width: 90px;

    span {
        opacity: 1;
    }
`;

const AbortContainer = styled.div`
    position: relative;
    height: 32px;
    border-radius: 20px;
    background: ${({ theme }) => theme.STROKE_GREY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    overflow: hidden;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    transition: width 0.15s ease-in-out;
    cursor: pointer;

    span {
        position: absolute;
        right: 12px;
        top: 8px;
        width: max-content;
        text-transform: uppercase;
        transition: opacity 0.25s ease-out;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        ${expandedStyle}
    }

    /*Linting error because of a complex interpolation*/

    ${/* sc-selector */ variables.MEDIA_QUERY.HOVER} {
        ${/* sc-block */ collapsedStyle}

        :hover {
            ${/* sc-block */ expandedStyle}
        }
    }
`;

const CloseIcon = styled(Icon)`
    position: absolute;
    left: 0;
    top: 0;
    padding: 15.5px;
    border-radius: 20px;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

interface AbortButtonProps {
    onAbort: () => void;
    className?: string;
}

export const AbortButton = ({ onAbort, className }: AbortButtonProps) => {
    const theme = useTheme();

    // checks compatability for use in other places
    const isActionAbortable = useSelector(selectIsActionAbortable);

    if (!isActionAbortable) {
        return null;
    }

    return (
        <AbortContainer
            key="@modal/close-button" // passed in array
            data-test="@modal/close-button"
            onClick={onAbort}
            className={className}
        >
            <Translation id="TR_ABORT" />
            <CloseIcon size={18} color={theme.TYPE_LIGHT_GREY} icon="CROSS" />
        </AbortContainer>
    );
};

export interface DevicePromptModalProps {
    isPillShown?: boolean;
    isConfirmed?: boolean;
    pillTitle?: string;
    renderer?: ComponentType<TrezorModalProps>;
    isAbortable?: boolean;
    onAbort?: () => void;
    className?: string;
    children?: React.ReactNode;
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

    // duplicated because headerComponents should receive undefined if isAbortable === false
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
                            isConfirmed={isConfirmed}
                        />
                    )
                }
                headerComponents={
                    isActionAbortable
                        ? [<AbortButton key="abort-button" onAbort={onAbort} />]
                        : undefined
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
