import { ReactElement } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { TranslationKey } from '@suite-common/intl-types';
import { acquireDevice, selectDevice } from '@suite-common/wallet-core';
import { variables } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevice } from '@trezor/product-components';

import { closeModalApp } from 'src/actions/suite/routerActions';
import {
    CheckSeedStep,
    FirmwareCloseButton,
    FirmwareInstallation,
    FirmwareUpdateHashCheckError,
} from 'src/components/firmware';
import { Translation, Modal, PrerequisitesGuide } from 'src/components/suite';
import { OnboardingStepBox } from 'src/components/onboarding';
import { useDispatch, useFirmware, useSelector } from 'src/hooks/suite';
import messages from 'src/support/messages';

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
    heading: TranslationKey;
    install: () => void;
    isCustom?: boolean;
    shouldSwitchFirmwareType?: boolean;
};

export const FirmwareModal = ({
    children,
    heading,
    install,
    isCustom,
    shouldSwitchFirmwareType,
}: FirmwareModalProps) => {
    const {
        resetReducer,
        status,
        deviceWillBeWiped,
        error,
        firmwareHashInvalid,
        uiEvent,
        confirmOnDevice,
        showConfirmationPill,
    } = useFirmware({ shouldSwitchFirmwareType });
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();
    const intl = useIntl();

    const deviceModelInternal = uiEvent?.payload.device.features?.internal_model;
    const isCancelable = ['initial', 'check-seed', 'done', 'error'].includes(status);
    const isAwaitingPinEntry =
        uiEvent?.type === 'button' && uiEvent.payload.code === 'ButtonRequest_PinEntry';

    const handleClose = () => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice(device));
        }
        dispatch(closeModalApp());
        resetReducer();
    };
    const handlePinCancel = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    const getComponent = (): ReactElement => {
        if (
            (!device?.connected || !device?.features) &&
            ['initial', 'check-seed'].includes(status)
        ) {
            return <PrerequisitesGuide />;
        }

        switch (status) {
            case 'error':
                // Special and hopefully very rare case. This appears when somebody tried to fool user into using a hacked firmware. This check is skipped when installing custom FW.
                if (device?.id && firmwareHashInvalid.includes(device.id)) {
                    return <FirmwareUpdateHashCheckError error={error} />;
                }

                return (
                    <OnboardingStepBox
                        image="FIRMWARE"
                        heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                        description={
                            <Translation id="TOAST_GENERIC_ERROR" values={{ error: error || '' }} />
                        }
                        innerActions={<FirmwareCloseButton onClick={handleClose} />}
                        nested
                    />
                );
            case 'initial':
                return children;
            case 'check-seed':
                return (
                    <CheckSeedStep
                        deviceWillBeWiped={deviceWillBeWiped}
                        onSuccess={install}
                        onClose={handleClose}
                    />
                );
            case 'started':
            case 'done':
                return (
                    <FirmwareInstallation
                        standaloneFwUpdate
                        install={install}
                        onSuccess={handleClose}
                        onPromptClose={handleClose}
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
                        onCancel={isAwaitingPinEntry ? handlePinCancel : undefined}
                    />
                )
            }
            onCancel={handleClose}
            data-testid="@firmware-modal"
            heading={<Translation id={heading} />}
        >
            <Wrapper $isWithTopPadding={!isCancelable}>{getComponent()}</Wrapper>
        </StyledModal>
    );
};
