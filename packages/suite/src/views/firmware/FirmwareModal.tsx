import { ReactElement } from 'react';
import styled from 'styled-components';

import { acquireDevice, selectDevice } from '@suite-common/wallet-core';
import { ConfirmOnDevice, variables } from '@trezor/components';

import { closeModalApp } from 'src/actions/suite/routerActions';
import {
    CheckSeedStep,
    FirmwareCloseButton,
    FirmwareInstallation,
    ReconnectDevicePrompt,
} from 'src/components/firmware';
import { Translation, Modal } from 'src/components/suite';
import { ConnectDevicePromptManager, OnboardingStepBox } from 'src/components/onboarding';
import { useDispatch, useFirmware, useSelector } from 'src/hooks/suite';
import { TranslationKey } from '@suite-common/intl-types';

const Wrapper = styled.div<{ $isWithTopPadding: boolean }>`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    text-align: left;
    position: relative;

    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        padding-top: ${({ $isWithTopPadding }) => $isWithTopPadding && '44px'};
    }
`;

const StyledModal = styled(Modal)`
    width: 620px;
    min-height: 540px;
`;

type FirmwareModalProps = {
    children: ReactElement;
    deviceWillBeWiped?: boolean;
    heading: TranslationKey;
    install: () => void;
    isCustom?: boolean;
};

export const FirmwareModal = ({
    children,
    deviceWillBeWiped,
    heading,
    install,
    isCustom,
}: FirmwareModalProps) => {
    const {
        resetReducer,
        status,
        error,
        firmwareHashInvalid,
        uiEvent,
        confirmOnDevice,
        showReconnectPrompt,
        showConfirmationPill,
    } = useFirmware();
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    const deviceModelInternal = uiEvent?.payload.device.features?.internal_model;
    const isCancelable = ['initial', 'check-seed', 'done', 'error'].includes(status);

    const onClose = () => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice(device));
        }
        dispatch(closeModalApp());
        resetReducer();
    };

    const getComponent = (): ReactElement => {
        if (
            (!device?.connected || !device?.features) &&
            ['initial', 'check-seed'].includes(status)
        ) {
            return <ConnectDevicePromptManager device={device} />;
        }

        // Special and hopefully very rare case. This appears when somebody tried to fool user into using a hacked firmware. This check is skipped when installing custom FW.
        if (device?.id && firmwareHashInvalid.includes(device.id)) {
            return (
                <OnboardingStepBox
                    image="UNI_ERROR"
                    heading={<Translation id="TR_FIRMWARE_HASH_MISMATCH" />}
                    nested
                />
            );
        }

        switch (status) {
            case 'error':
                return (
                    <OnboardingStepBox
                        image="FIRMWARE"
                        heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                        description={
                            <Translation id="TOAST_GENERIC_ERROR" values={{ error: error || '' }} />
                        }
                        innerActions={<FirmwareCloseButton onClick={onClose} />}
                        nested
                    />
                );
            case 'initial':
                return children;
            case 'check-seed':
                return (
                    <CheckSeedStep
                        onSuccess={install}
                        onClose={onClose}
                        willBeWiped={deviceWillBeWiped}
                    />
                );
            case 'started':
            case 'done':
                return (
                    <FirmwareInstallation
                        standaloneFwUpdate
                        onSuccess={onClose}
                        customFirmware={isCustom}
                    />
                );
        }
    };

    return (
        <StyledModal
            isCancelable={isCancelable}
            modalPrompt={
                showConfirmationPill && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModelInternal={deviceModelInternal}
                        deviceUnitColor={uiEvent?.payload.device.features?.unit_color}
                        isConfirmed={!confirmOnDevice}
                    />
                )
            }
            onCancel={onClose}
            data-test="@firmware-modal"
            heading={<Translation id={heading} />}
        >
            {showReconnectPrompt && <ReconnectDevicePrompt onClose={onClose} onSuccess={install} />}
            <Wrapper $isWithTopPadding={!isCancelable}>{getComponent()}</Wrapper>
        </StyledModal>
    );
};
