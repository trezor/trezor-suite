import React, { useState } from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation, Image, WebusbButton } from '@suite-components';
import {
    InitImg,
    SuccessImg,
    FirmwareProgress,
    RetryButton,
    ContinueButton,
    InstallButton,
    BitcoinOnlyToggle,
} from '@firmware-components';
import { isWebUSB } from '@suite-utils/transport';
import { getFwVersion } from '@suite-utils/device';

import { Props } from './Container';

const StyledImage = styled(Image)`
    flex: 1;
`;

const FirmwareStep = ({
    device,
    transport,
    firmware,
    goToNextStep,
    goToPreviousStep,
    firmwareUpdate,
    toggleBtcOnly,
}: Props) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const { status, error, btcOnly } = firmware;
    const isConnected = !!device;
    const isInBootloader = Boolean(device && device.features && device.mode === 'bootloader');
    const model = device?.features?.major_version || 2;
    const btcOnlyAvailable = device?.features && device.firmwareRelease.release.url_bitcoinonly;

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <Translation id="TR_FIRMWARE_HEADING" />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {status === 'initial' && (
                    <>
                        {!device && (
                            <>
                                <Text>
                                    <Translation id="TR_CONNECT_YOUR_DEVICE" />
                                </Text>
                                <StyledImage
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageLoaded(true)}
                                    image="CONNECT_DEVICE"
                                />
                                {isWebUSB(transport) && (
                                    <WebusbButton ready={imageLoaded}>
                                        <Button icon="SEARCH">
                                            <Translation id="TR_CHECK_FOR_DEVICES" />
                                        </Button>
                                    </WebusbButton>
                                )}
                            </>
                        )}

                        {device?.firmware === 'none' && (
                            <Text>
                                <Translation id="TR_FIRMWARE_SUBHEADING" />
                            </Text>
                        )}

                        {device?.firmware === 'outdated' && !isInBootloader && (
                            <>
                                <Text>
                                    <Translation
                                        id="TR_FIRMWARE_INSTALLED_TEXT"
                                        values={{
                                            version: getFwVersion(device),
                                        }}
                                    />
                                </Text>
                                <Text>
                                    <Translation id="TR_YOU_MAY_EITHER_UPDATE" />
                                </Text>
                            </>
                        )}

                        {device?.firmware === 'required' && !isInBootloader && (
                            <>
                                <Text>
                                    <Translation
                                        id="TR_FIRMWARE_INSTALLED_TEXT"
                                        values={{
                                            version: getFwVersion(device),
                                        }}
                                    />
                                </Text>
                                <Text>
                                    <Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />
                                </Text>
                            </>
                        )}

                        {device?.firmware &&
                            ['outdated', 'required', 'none'].includes(device.firmware) && (
                                <>
                                    {btcOnlyAvailable && (
                                        <BitcoinOnlyToggle
                                            onToggle={toggleBtcOnly}
                                            isToggled={btcOnly}
                                        />
                                    )}

                                    <InitImg model={model} />
                                </>
                            )}

                        {device?.firmware === 'valid' && (
                            <>
                                <Text>
                                    <Translation id="TR_FIRMWARE_INSTALLED" />
                                </Text>
                                <SuccessImg model={model} />
                            </>
                        )}
                    </>
                )}

                {status === 'done' && (
                    <>
                        <Text>
                            <Translation id="TR_SUCCESS" />
                        </Text>
                        <SuccessImg model={model} />
                    </>
                )}

                {status === 'partially-done' && (
                    <>
                        <Text>
                            <Translation id="TR_FIRMWARE_PARTIALLY_UPDATED" />
                        </Text>
                        <Text>
                            <Translation id="TR_BUT_THERE_IS_ANOTHER_UPDATE" />
                        </Text>
                        <SuccessImg model={model} />
                    </>
                )}

                {status === 'error' && (
                    <>
                        <Text>
                            <Translation id="TR_FIRMWARE_INSTALL_FAILED_HEADER" />
                        </Text>
                        <Text>{error}</Text>
                        <StyledImage image="UNI_ERROR" />
                    </>
                )}

                {[
                    'downloading',
                    'started',
                    'waiting-for-confirmation',
                    'installing',
                    'check-fingerprint',
                    'unplug',
                    'wait-for-reboot',
                ].includes(status) && (
                    <FirmwareProgress
                        status={status}
                        fingerprint={device?.firmwareRelease.release.fingerprint}
                        model={model}
                    />
                )}
                {/* buttons section */}
                <Wrapper.Controls>
                    {/* 
                    special case, when doing firmware update with webusb transport, device must be 
                    paired again after firmware update is done 
                    */}
                    {['unplug', 'wait-for-reboot'].includes(status) &&
                        !device &&
                        isWebUSB(transport) && (
                            <WebusbButton ready>
                                <Button icon="SEARCH">
                                    <Translation id="TR_CHECK_FOR_DEVICES" />
                                </Button>
                            </WebusbButton>
                        )}
                    {['initial', 'done', 'partially-done'].includes(status) && (
                        <>
                            {device?.firmware &&
                                ['none', 'unknown', 'required', 'outdated'].includes(
                                    device.firmware,
                                ) && (
                                    <>
                                        <InstallButton
                                            btcOnly={btcOnly}
                                            isConnected={isConnected}
                                            isInBootloader={isInBootloader}
                                            onClick={firmwareUpdate}
                                        />
                                    </>
                                )}

                            {device?.firmware && ['outdated', 'valid'].includes(device.firmware) && (
                                <>
                                    <ContinueButton
                                        isConnected={isConnected}
                                        isInBootloader={isInBootloader}
                                        onClick={goToNextStep}
                                    />
                                </>
                            )}
                        </>
                    )}

                    {status === 'error' && (
                        <RetryButton isDisabled={!isConnected} onClick={firmwareUpdate} />
                    )}
                </Wrapper.Controls>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                {status === 'initial' && (
                    <OnboardingButton.Back onClick={() => goToPreviousStep()}>
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default FirmwareStep;
