import React, { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { TrezorConnect } from '@onboarding-components/Prompts';
import { Dots } from '@onboarding-components/Loaders';
import l10nCommonMessages from '@suite-support/Messages';
import { goToNextStep, goToPreviousStep } from '@suite/actions/onboarding/onboardingActions';
import { Wrapper, Text, OnboardingButton } from '@onboarding-components';

import TroubleshootBootloader from './components/TroubleshootBootloader';
import TroubleshootInitialized from './components/TroubleshootInitialized';
import TroubleshootSearchingTooLong from './components/TroubleshootTooLong';
import l10nMessages from './index.messages';
import { AppState } from '@suite-types';

interface StepProps {
    device: AppState['onboarding']['connect']['device'];
    model: AppState['onboarding']['selectedModel'];
    onboardingActions: {
        goToNextStep: typeof goToNextStep;
        goToPreviousStep: typeof goToPreviousStep;
    };
}

const ConnectStep = ({ device, model, onboardingActions }: StepProps) => {
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [isSearchingTooLong, setIsSearchingTooLong] = useState<boolean>(false);

    const deviceIsConnected = Boolean(device && device.connected);

    useEffect(() => {
        const IS_SEARCHING_TIMEOUT = 5 * 1000;
        const IS_SEARCHING_TOO_LONG_TIMEOUT = 15 * 1000;
        let isSearchingTimeout: number;
        let isSearchingTooLongTimeout: number;
        setIsSearching(false);
        setIsSearchingTooLong(false);
        if (!deviceIsConnected) {
            isSearchingTimeout = setTimeout(() => {
                setIsSearching(true);
            }, IS_SEARCHING_TIMEOUT);
            isSearchingTooLongTimeout = setTimeout(() => {
                setIsSearchingTooLong(true);
            }, IS_SEARCHING_TOO_LONG_TIMEOUT);
        }

        return () => {
            clearTimeout(isSearchingTimeout);
            clearTimeout(isSearchingTooLongTimeout);
        };
    }, [deviceIsConnected]);

    const isInBlWithFwPresent = () => {
        if (!device) {
            return null;
        }
        return device.mode === 'bootloader' && device.features.firmware_present === true;
    };

    const getStatus = () => {
        if (isSearching && !isSearchingTooLong) {
            return 'searching';
        }
        if (isSearchingTooLong) {
            return 'searching-long';
        }
        if (isInBlWithFwPresent()) {
            return 'unexpected-bootloader';
        }
        if (device && device.features && device.features.initialized) {
            return 'unexpected-initialized';
        }
        if (deviceIsConnected) {
            return 'connected';
        }
        return null;
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {(!getStatus() || getStatus() === 'searching') && (
                    <FormattedMessage {...l10nMessages.TR_CONNECT_HEADING} />
                )}
                {getStatus() === 'searching-long' && <>We dont see your device</>}
                {getStatus() === 'connected' && (
                    <FormattedMessage {...l10nMessages.TR_DEVICE_DETECTED} />
                )}
                {getStatus() === 'unexpected-bootloader' && (
                    <FormattedMessage {...l10nMessages.TR_DEVICE_IN_BOOTLOADER_MODE} />
                )}
                {getStatus() === 'unexpected-initialized' && (
                    <FormattedMessage {...l10nMessages.TR_DEVICE_IS_INITIALIZED} />
                )}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {(!getStatus() || getStatus() === 'searching') && (
                    <>
                        <TrezorConnect model={model || 2} height={180} loop={!deviceIsConnected} />
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_MAKE_SURE_IT_IS_WELL_CONNECTED} />{' '}
                            <FormattedMessage {...l10nMessages.TR_SEARCHING_FOR_YOUR_DEVICE} />
                            <Dots />
                        </Text>
                    </>
                )}

                {getStatus() === 'searching-long' && <TroubleshootSearchingTooLong />}

                {getStatus() === 'unexpected-bootloader' && <TroubleshootBootloader />}

                {getStatus() === 'unexpected-initialized' && <TroubleshootInitialized />}

                {getStatus() === 'connected' && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_FOUND_OK_DEVICE} />
                        </Text>
                        <Wrapper.Controls>
                            <OnboardingButton.Cta onClick={() => onboardingActions.goToNextStep()}>
                                <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls>
                    <OnboardingButton.Back onClick={() => onboardingActions.goToPreviousStep()}>
                        Back
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
            <Text>
                // in case device is already connected, shouldnt we skip this step directly to fw?
            </Text>
        </Wrapper.Step>
    );
};

export default ConnectStep;
