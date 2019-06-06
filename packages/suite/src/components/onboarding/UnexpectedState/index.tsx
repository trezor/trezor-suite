import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { P, H2, Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import * as STEP from '@suite/constants/onboarding/steps';
import PinMatrix from '@suite/components/onboarding/PinMatrix';
import Text from '@suite/components/onboarding/Text';
import { ConnectActions, ConnectReducer } from '@suite/types/onboarding/connect';
import { OnboardingActions } from '@suite/types/onboarding/onboarding';
import { AnyStepDisallowedState } from '@suite/types/onboarding/steps';
import l10nMessages from './index.messages';
// import Reconnect from './Reconnect';
import { ControlsWrapper } from '../Wrapper';

const Wrapper = styled.div`
    margin: auto 30px auto 30px;
    text-align: center;
    width: 100%;
`;

interface UnexpectedStateCommonProps {
    onboardingActions: OnboardingActions;
}

const UnexpectedStateCommon: FunctionComponent<
    React.PropsWithChildren<UnexpectedStateCommonProps>
> = ({ children }) => <Wrapper>{children}</Wrapper>;

const IsSameDevice: FunctionComponent = () => (
    <P>
        <FormattedMessage {...l10nMessages.TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT} />
    </P>
);

const IsNotInBootloader: FunctionComponent = () => (
    <P>
        <FormattedMessage {...l10nMessages.TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER} />
    </P>
);

interface IsDeviceRequestingPinProps {
    connectActions: ConnectActions;
    uiInteraction: ConnectReducer['uiInteraction'];
}

const IsDeviceRequestingPin: FunctionComponent<IsDeviceRequestingPinProps> = ({
    connectActions,
    uiInteraction,
}) => (
    <React.Fragment>
        <H2>
            {uiInteraction.counter === 1 && (
                <FormattedMessage {...l10nMessages.TR_ENTER_PIN_HEADING} />
            )}
            {uiInteraction.counter > 1 && 'Incorrect PIN entered'}
        </H2>
        <Text>
            {uiInteraction.counter === 1 && (
                <FormattedMessage {...l10nMessages.TR_ENTER_PIN_TEXT} />
            )}
            {uiInteraction.counter > 1 &&
                'You entered wrong PIN. To make sure, that your device can not be accessed by unauthorized person, it will get wiped after 16 incorrect entries.'}
        </Text>
        <PinMatrix
            onPinSubmit={pin => {
                connectActions.submitNewPin({ pin });
            }}
        />
    </React.Fragment>
);

interface DeviceIsUsedHereProps {
    connectActions: ConnectActions;
}

const DeviceIsUsedHere: FunctionComponent<DeviceIsUsedHereProps> = ({ connectActions }) => (
    <React.Fragment>
        <H2>
            <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING} />
        </H2>
        <P>
            <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT} />
        </P>
        <ControlsWrapper>
            <Button onClick={connectActions.getFeatures}>
                <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON} />
            </Button>
        </ControlsWrapper>
    </React.Fragment>
);

interface UnexpectedStateProps {
    caseType: AnyStepDisallowedState | string;
    model: number;
    connectActions: ConnectActions;
    onboardingActions: OnboardingActions;
    uiInteraction: ConnectReducer['uiInteraction'];
}

const UnexpectedState = ({
    caseType,
    model,
    connectActions,
    onboardingActions,
    uiInteraction,
}: UnexpectedStateProps): any => {
    switch (caseType) {
        // case STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED:
        //     return <UnexpectedStateCommon onboardingActions={onboardingActions}><Reconnect model={model} /></UnexpectedStateCommon>;
        case STEP.DISALLOWED_IS_NOT_SAME_DEVICE:
            return (
                <UnexpectedStateCommon onboardingActions={onboardingActions}>
                    <IsSameDevice />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER:
            return (
                <UnexpectedStateCommon onboardingActions={onboardingActions}>
                    <IsNotInBootloader />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_DEVICE_IS_REQUESTING_PIN:
            return (
                <UnexpectedStateCommon onboardingActions={onboardingActions}>
                    <IsDeviceRequestingPin
                        uiInteraction={uiInteraction}
                        connectActions={connectActions}
                    />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE:
            return (
                <UnexpectedStateCommon onboardingActions={onboardingActions}>
                    <DeviceIsUsedHere connectActions={connectActions} />
                </UnexpectedStateCommon>
            );
        default:
            return (
                <UnexpectedStateCommon onboardingActions={onboardingActions}>
                    Error: {caseType}
                </UnexpectedStateCommon>
            );
    }
};

export default UnexpectedState;
