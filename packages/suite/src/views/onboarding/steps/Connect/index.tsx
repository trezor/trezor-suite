import React, { useState, useEffect } from 'react';

import { H4, Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { TrezorConnect } from '@suite/components/onboarding/Prompts';
import { Dots } from '@suite/components/onboarding/Loaders';
import Text from '@suite/components/onboarding/Text';
import l10nCommonMessages from '@suite-support/Messages';
import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

import { AppState } from '@suite-types/index';
import { goToNextStep } from '@suite/actions/onboarding/onboardingActions';
import TroubleshootBootloader from './components/TroubleshootBootloader';
import TroubleshootInitialized from './components/TroubleshootInitialized';
import TroubleshootSearchingTooLong from './components/TroubleshootTooLong';
import l10nMessages from './index.messages';

interface StepProps {
    device: AppState['onboarding']['connect']['device'];
    deviceCall: AppState['onboarding']['connect']['deviceCall'];
    model: AppState['onboarding']['selectedModel'];
    isResolved: boolean; // todo: ?
    onboardingActions: {
        goToNextStep: typeof goToNextStep;
    };
}

const ConnectStep = ({ device, deviceCall, isResolved, model, onboardingActions }: StepProps) => {
    const IS_SEARCHING_TIMEOUT = 5 * 1000;
    const IS_SEARCHING_TOO_LONG_TIMEOUT = 15 * 1000;

    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [isSearchingTooLong, setIsSearchingTooLong] = useState<boolean>(false);

    const deviceIsConnected = Boolean(device && device.connected);

    useEffect(() => {
        let isSearchingTimeout: number;
        let isSearchingTooLongTimeout: number;
        if (!device) {
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
    }, [IS_SEARCHING_TIMEOUT, IS_SEARCHING_TOO_LONG_TIMEOUT, device]);

    const isInBlWithFwPresent = () => {
        if (!device) {
            return null;
        }
        return device.mode === 'bootloader' && device.features.firmware_present === true;
    };

    return (
        <StepWrapper>
            <StepHeadingWrapper>
                <FormattedMessage {...l10nMessages.TR_CONNECT_HEADING} />
            </StepHeadingWrapper>
            <StepBodyWrapper>
                <TrezorConnect model={model || 2} height={180} loop={!deviceIsConnected} />

                {!deviceIsConnected && (
                    <Text>
                        <FormattedMessage {...l10nMessages.TR_MAKE_SURE_IT_IS_WELL_CONNECTED} />{' '}
                        <FormattedMessage {...l10nMessages.TR_SEARCHING_FOR_YOUR_DEVICE} />
                        <Dots />
                    </Text>
                )}

                {!deviceIsConnected && isSearching && isSearchingTooLong && (
                    <TroubleshootSearchingTooLong />
                )}

                {deviceIsConnected && !deviceCall.isProgress && (
                    <React.Fragment>
                        {!device.features.initialized && isInBlWithFwPresent() === false && (
                            <React.Fragment>
                                <H4>
                                    <FormattedMessage {...l10nMessages.TR_DEVICE_DETECTED} />
                                </H4>
                                <Text>
                                    <FormattedMessage {...l10nMessages.TR_FOUND_OK_DEVICE} />
                                </Text>
                                <ControlsWrapper>
                                    <Button onClick={() => onboardingActions.goToNextStep()}>
                                        <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                    </Button>
                                </ControlsWrapper>
                            </React.Fragment>
                        )}

                        {isInBlWithFwPresent() && <TroubleshootBootloader />}

                        {device.features.initialized && !isResolved && <TroubleshootInitialized />}

                        {device.features.initialized && isResolved && (
                            <React.Fragment>
                                <H4>
                                    <FormattedMessage {...l10nMessages.TR_DEVICE_DETECTED} />
                                </H4>
                                <Text>Found a device you have previously initialized</Text>
                                <ControlsWrapper>
                                    <Button onClick={() => onboardingActions.goToNextStep()}>
                                        <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                    </Button>
                                </ControlsWrapper>
                            </React.Fragment>
                        )}
                    </React.Fragment>
                )}
            </StepBodyWrapper>
        </StepWrapper>
    );
};

export default ConnectStep;
