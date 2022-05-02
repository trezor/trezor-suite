import React, { ComponentType, useMemo } from 'react';
import ReactDOM from 'react-dom';
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
import { useSelector } from '@suite-hooks/useSelector';
import { ModalEnvironment } from './ModalEnvironment';
import { useModalTarget } from '@suite-support/ModalContext';
import { Modal } from '.';
import { versionUtils } from '@trezor/utils';

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
    width: 36px;

    span {
        opacity: 0;
    }
`;

const expandedStyle = css`
    width: 100px;

    span {
        opacity: 1;
    }
`;

const AbortContainer = styled.div`
    position: relative;
    height: 36px;
    border-radius: 20px;
    background: ${({ theme }) => theme.STROKE_GREY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    overflow: hidden;
    transition: width 0.15s ease-in-out;
    cursor: pointer;

    span {
        position: absolute;
        right: 12px;
        top: 9px;
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
    padding: 17.5px;
    border-radius: 20px;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

export interface DevicePromptModalProps {
    isPillShown?: boolean;
    isConfirmed?: boolean;
    pillTitle?: string;
    renderer?: ComponentType<TrezorModalProps>;
    onAbort?: () => void;
    className?: string;
    children?: React.ReactNode;
    'data-test'?: string;
}

const DevicePromptModalRenderer = ({
    isPillShown = true,
    isConfirmed,
    pillTitle,
    onAbort = () => TrezorConnect.cancel(),
    ...rest
}: DevicePromptModalProps) => {
    const deviceVerions = useSelector(state => state.suite.device?.features?.major_version);
    const transport = useSelector(state => state.suite.transport);
    const modalTarget = useModalTarget();
    const theme = useTheme();

    const isAbortable =
        transport?.type === 'bridge'
            ? versionUtils.isNewerOrEqual(transport?.version as string, '2.0.31')
            : true; // Works via WebUSB

    const AbortButton = useMemo(
        () => (
            <AbortContainer onClick={onAbort} data-test="@modal/close-button">
                <Translation id="TR_ABORT" />
                <CloseIcon size={20} color={theme.TYPE_LIGHT_GREY} icon="CROSS" />
            </AbortContainer>
        ),
        [onAbort, theme],
    );

    if (!modalTarget) return null;

    const modalComponent = (
        <ModalEnvironment>
            <StyledTrezorModal
                modalPrompt={
                    isPillShown && (
                        <ConfirmOnDevice
                            title={pillTitle || <Translation id="TR_CONFIRM_ON_TREZOR" />}
                            trezorModel={deviceVerions === 1 ? 1 : 2}
                            isConfirmed={isConfirmed}
                        />
                    )
                }
                headerComponents={isAbortable ? [AbortButton] : undefined}
                {...rest}
            />
        </ModalEnvironment>
    );

    return ReactDOM.createPortal(modalComponent, modalTarget);
};

export const DevicePromptModal = (props: DevicePromptModalProps) => (
    <Modal {...props} renderer={props.renderer || DevicePromptModalRenderer} />
);
