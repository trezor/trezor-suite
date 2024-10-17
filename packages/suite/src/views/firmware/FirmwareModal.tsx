import { ReactElement } from 'react';
import styled from 'styled-components';

import { acquireDevice, selectDevice } from '@suite-common/wallet-core';
import { variables } from '@trezor/components';

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
import { TranslationKey } from '@suite-common/intl-types';
import { ConfirmOnDevice } from '@trezor/product-components';

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
                        install={install}
                        onSuccess={onClose}
                        onPromptClose={onClose}
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
            data-testid="@firmware-modal"
            heading={<Translation id={heading} />}
        >
            <Wrapper $isWithTopPadding={!isCancelable}>{getComponent()}</Wrapper>
        </StyledModal>
    );
};
