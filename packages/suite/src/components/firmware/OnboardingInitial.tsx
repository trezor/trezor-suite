import React from 'react';
import { Button } from '@trezor/components';

import { Translation } from '@suite-components';
import { getFwVersion } from '@suite-utils/device';
import { useDevice, useFirmware, useActions } from '@suite-hooks';
import { P, H2, InitImg, ConnectInNormalImg } from '@firmware-components';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

const Body = () => {
    const { device } = useDevice();

    if (!device?.connected || !device?.features)
        return (
            <>
                <ConnectInNormalImg />
                <H2>
                    <Translation id="TR_CONNECT_YOUR_DEVICE" />
                </H2>
            </>
        );

    if (device?.firmware === 'none') {
        return (
            <>
                <InitImg model={device.features?.major_version} />
                <H2>
                    <Translation id="TR_INSTALL_FIRMWARE" />
                </H2>
                <P>
                    <Translation id="TR_FIRMWARE_SUBHEADING" />
                </P>
            </>
        );
    }

    if (device.firmware === 'required') {
        return (
            <>
                <InitImg model={device.features?.major_version} />
                <H2>
                    <Translation id="TR_INSTALL_FIRMWARE" />
                </H2>
                <P>
                    <Translation
                        id="TR_FIRMWARE_INSTALLED_TEXT"
                        values={{
                            version: getFwVersion(device),
                        }}
                    />
                </P>
                <P>
                    <Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />
                </P>
            </>
        );
    }

    if (device.firmware === 'outdated') {
        return (
            <>
                <InitImg model={device.features?.major_version} />
                {/* TODO: H2 subheading? */}
                <P>
                    <Translation
                        id="TR_FIRMWARE_INSTALLED_TEXT"
                        values={{
                            version: getFwVersion(device),
                        }}
                    />
                </P>
                <P>
                    <Translation id="TR_YOU_MAY_EITHER_UPDATE" />
                </P>
            </>
        );
    }

    // device.firmware === 'valid' in NoNewFirmware

    return null;
};

const BottomBar = () => {
    const { setStatus, firmwareUpdate } = useFirmware();
    const { device } = useDevice();
    const { goToNextStep } = useActions({
        goToNextStep: onboardingActions.goToNextStep,
    });

    if (!device?.connected || !device?.features) return null;

    if (device?.firmware === 'none') {
        return (
            <Button onClick={() => firmwareUpdate()} data-test="@firmware/start-button">
                <Translation id="TR_INSTALL" />
            </Button>
        );
    }

    const getPrimaryButtonProps = () => {
        return {
            onClick: () => setStatus('waiting-for-bootloader'),
            children: <Translation id="TR_INSTALL" />,
            'data-test': '@firmware/get-ready-button',
        };
    };

    if (device.firmware === 'required') {
        return (
            <>
                <Button {...getPrimaryButtonProps()} />
            </>
        );
    }

    if (device.firmware === 'outdated') {
        return (
            <>
                <Button {...getPrimaryButtonProps()} />

                <Button
                    variant="secondary"
                    onClick={() => goToNextStep()}
                    data-test="@firmware/skip-button"
                >
                    <Translation id="TR_SKIP" />
                </Button>
            </>
        );
    }

    // device.firmware === 'valid'
    // solved in NoNewFirmware

    return null;
};

export const OnboardingInitialStep = {
    Body,
    BottomBar,
};
