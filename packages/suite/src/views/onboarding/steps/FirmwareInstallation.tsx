import styled from 'styled-components';

import { useFirmwareInstallation } from '@suite-common/firmware';
import { Button } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { FirmwareOffer, FirmwareProgressBar, ReconnectDevicePrompt } from 'src/components/firmware';
import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation, WebUsbButton } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectHasTransportOfType, selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';

const SelectDevice = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${spacingsPx.lg};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

interface FirmwareInstallationProps {
    install: () => void;
    onSuccess: () => void;
}

const InnerActionComponent = ({ onSuccess }: Pick<FirmwareInstallationProps, 'onSuccess'>) => {
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const { status, reconnectEvent } = useFirmwareInstallation();
    if (
        isWebUsbTransport &&
        reconnectEvent &&
        reconnectEvent.disconnected &&
        reconnectEvent.i > 2 && // Add some latency for cases when the device is already paired or is restarting.
        status !== 'done'
    ) {
        return (
            <SelectDevice>
                <Translation id="TR_SELECT_TREZOR_TO_CONTINUE" />
                <WebUsbButton translationId="TR_SELECT_TREZOR" size="medium" icon={false} />
            </SelectDevice>
        );
    }

    if (reconnectEvent) {
        if (
            !isWebUsbTransport &&
            reconnectEvent.target === 'bootloader' &&
            reconnectEvent.method === 'auto'
        ) {
            return <SelectDevice>Confirm installation on Trezor</SelectDevice>;
        }
    }

    if (status === 'done') {
        return (
            <Button variant="primary" onClick={onSuccess} data-testid="@firmware/continue-button">
                <Translation id="TR_CONTINUE" />
            </Button>
        );
    }
};

export const FirmwareInstallation = ({ install, onSuccess }: FirmwareInstallationProps) => {
    const { showReconnectPrompt, targetType } = useFirmwareInstallation();
    const isActionAbortable = useSelector(selectIsActionAbortable);
    // const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    // const getInnerActionComponent = () => {
    //     if (
    //         // isWebUsbTransport &&
    //         firmwareReconnectEvent?.payload.disconnected &&
    //         firmwareReconnectEvent.payload.i > 2 && // Add some latency for cases when the device is already paired or is restarting.
    //         status !== 'done'
    //     ) {
    //         // Device needs to be paired twice when using web usb transport.
    //         // Once in bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
    //         // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time paired as a bootloader device).
    //         // Suite won't detect such a restarted device, which will be now in normal mode, till it is paired again.

    //         if (isWebUsbTransport) {
    //             return (
    //                 <SelectDevice>
    //                     <Translation id="TR_SELECT_TREZOR_TO_CONTINUE" />
    //                     <WebUsbButton translationId="TR_SELECT_TREZOR" size="medium" icon={false} />
    //                 </SelectDevice>
    //             );
    //         }

    //         return <SelectDevice>Foo bar</SelectDevice>;
    //     }
    //     if (status === 'done') {
    //         return (
    //             <Button
    //                 variant="primary"
    //                 onClick={onSuccess}
    //                 data-testid="@firmware/continue-button"
    //             >
    //                 <Translation id="TR_CONTINUE" />
    //             </Button>
    //         );
    //     }
    // };

    return (
        <>
            {showReconnectPrompt && (
                <ReconnectDevicePrompt
                    onSuccess={install}
                    onClose={() => {
                        console.warn('Close!');
                    }}
                />
            )}
            <OnboardingStepBox
                image="FIRMWARE"
                heading={<Translation id="TR_INSTALL_FIRMWARE" />}
                device={undefined}
                isActionAbortable={isActionAbortable}
                innerActions={<InnerActionComponent onSuccess={onSuccess} />}
            >
                <FirmwareOffer isCustomFirmware={false} targetFirmwareType={targetType} />
                <FirmwareProgressBar />
            </OnboardingStepBox>
        </>
    );
};
