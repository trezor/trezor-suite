import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { P, H2 } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as STEP from '@onboarding-constants/steps';
import { AnyStepDisallowedState } from '@onboarding-types/steps';
import { getFeatures, submitNewPin } from '@onboarding-actions/connectActions';
import { Text, Wrapper, OnboardingButton } from '@onboarding-components';
import { PinInput } from '@suite-components';
import { Dispatch, AppState } from '@suite-types';
import messages from '@suite/support/messages';
import Reconnect from './components/Reconnect';
import IsSameDevice from './components/IsSameDevice';
import IsNotNewDevice from './components/IsNotNewDevice';

const CommonWrapper = styled.div`
    margin: auto 30px auto 30px;
    text-align: center;
    width: 100%;
`;

const UnexpectedStateCommon = ({ children }: { children: ReactNode }) => (
    <CommonWrapper>{children}</CommonWrapper>
);

const IsNotInBootloader = () => (
    <P>
        <Translation>{messages.TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER}</Translation>
    </P>
);

interface IsDeviceRequestingPinProps {
    submitNewPin: typeof submitNewPin;
    uiInteraction: AppState['onboarding']['uiInteraction'];
}

const IsDeviceRequestingPin = ({ submitNewPin, uiInteraction }: IsDeviceRequestingPinProps) => {
    if (typeof uiInteraction.counter !== 'number') return null;
    return (
        <>
            <H2>
                {uiInteraction.counter === 0 && (
                    <Translation>{messages.TR_ENTER_PIN_HEADING} ></Translation>
                )}
                {uiInteraction.counter > 1 && 'Incorrect PIN entered'}
            </H2>
            <Text>
                {uiInteraction.counter === 0 && (
                    <Translation>{messages.TR_ENTER_PIN_TEXT}</Translation>
                )}
                {uiInteraction.counter > 1 &&
                    'You entered wrong PIN. To make sure, that your device can not be accessed by unauthorized person, it will get wiped after 16 incorrect entries.'}
            </Text>
            <PinInput
                onPinSubmit={pin => {
                    submitNewPin({ pin });
                }}
            />
        </>
    );
};

interface DeviceIsUsedHereProps {
    actionCta: typeof getFeatures;
}

const DeviceIsUsedHere = ({ actionCta }: DeviceIsUsedHereProps) => (
    <>
        <H2>
            <Translation>{messages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING}</Translation>
        </H2>
        <P>
            <Translation>{messages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT}</Translation>
        </P>
        <Wrapper.Controls>
            <OnboardingButton.Cta onClick={actionCta}>
                <Translation>{messages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON}</Translation>
            </OnboardingButton.Cta>
        </Wrapper.Controls>
    </>
);

interface UnexpectedStateProps {
    caseType: AnyStepDisallowedState;
    prevModel: number;
    getFeatures: typeof getFeatures;
    submitNewPin: typeof submitNewPin;
    uiInteraction: AppState['onboarding']['uiInteraction'];
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getFeatures: bindActionCreators(getFeatures, dispatch),
    submitNewPin: bindActionCreators(submitNewPin, dispatch),
});

const UnexpectedState = ({
    caseType,
    prevModel,
    submitNewPin,
    getFeatures,
    uiInteraction,
}: UnexpectedStateProps) => {
    switch (caseType) {
        case STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED:
            return (
                <UnexpectedStateCommon>
                    <Reconnect model={prevModel} />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_IS_NOT_SAME_DEVICE:
            return (
                <UnexpectedStateCommon>
                    <IsSameDevice />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER:
            return (
                <UnexpectedStateCommon>
                    <IsNotInBootloader />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_DEVICE_IS_REQUESTING_PIN:
            return (
                <UnexpectedStateCommon>
                    <IsDeviceRequestingPin
                        uiInteraction={uiInteraction}
                        submitNewPin={submitNewPin}
                    />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE:
            return (
                <UnexpectedStateCommon>
                    <DeviceIsUsedHere actionCta={getFeatures} />
                </UnexpectedStateCommon>
            );
        case STEP.DISALLOWED_DEVICE_IS_NOT_NEW_DEVICE:
            return (
                <UnexpectedStateCommon>
                    <IsNotNewDevice />
                </UnexpectedStateCommon>
            );
        default:
            return <UnexpectedStateCommon>Error: {caseType}</UnexpectedStateCommon>;
    }
};

export default connect(null, mapDispatchToProps)(UnexpectedState);
