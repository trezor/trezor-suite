import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { Card, Column, Paragraph } from '@trezor/components';

import {
    FirmwareOffer,
    FirmwareProgressBar,
    ReconnectDevicePrompt,
    RotatingPhrases,
} from 'src/components/firmware';
import { WebUsbButton } from 'src/components/suite';
import { useFirmwareDesktopUpdate } from 'src/hooks/suite/useFirmwareDesktopUpdate';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectHasTransportOfType } from 'src/selectors/suite/suiteSelectors';

type FirmwareInstallationStepProps = {
    install: () => void;
    onSuccess: () => void;
};

export const FirmwareInstallationStep = ({ install, onSuccess }: FirmwareInstallationStepProps) => {
    const { status, showReconnectPrompt, targetType, reconnectEvent } = useFirmwareDesktopUpdate();
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));

    const getInnerActionComponent = () => {
        if (
            isWebUsbTransport &&
            reconnectEvent &&
            reconnectEvent.disconnected &&
            reconnectEvent.i > 2 && // Add some latency for cases when the device is already paired or is restarting.
            status !== 'done'
        ) {
            // Device needs to be paired twice when using web usb transport.
            // Once in bootloader mode and once in normal mode. Without 2nd pairing step would get stuck at waiting for
            // a reboot in case of fresh device which is, from the start, in bootloader mode (thus first time paired as a bootloader device).
            // Suite won't detect such a restarted device, which will be now in normal mode, till it is paired again.
            return (
                <Column alignItems="center" gap={12}>
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_SELECT_TREZOR_TO_CONTINUE" />
                    </Paragraph>
                    <WebUsbButton size="medium">
                        <Translation id="TR_SELECT_TREZOR" />
                    </WebUsbButton>
                </Column>
            );
        }
        if (status === 'done') {
            return (
                <OnboardingCard.Button onClick={onSuccess} data-testid="@firmware/continue-button">
                    <Translation id="TR_CONTINUE" />
                </OnboardingCard.Button>
            );
        }
    };

    return (
        <>
            {showReconnectPrompt && <ReconnectDevicePrompt onSuccess={install} />}
            <OnboardingCard
                iconName="circuitry"
                heading={<Translation id="TR_INSTALL_FIRMWARE" />}
                isActionAbortable={true}
                innerActions={getInnerActionComponent()}
            >
                <Column gap={60}>
                    <Card>
                        <Column gap={8}>
                            <FirmwareOffer
                                isCustomFirmware={false}
                                targetFirmwareType={targetType}
                            />
                            <FirmwareProgressBar />
                        </Column>
                    </Card>
                    <RotatingPhrases />
                </Column>
            </OnboardingCard>
        </>
    );
};
