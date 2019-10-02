import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { P, H2 } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as STEP from '@suite/constants/onboarding/steps';
import { AnyStepDisallowedState } from '@suite/types/onboarding/steps';
import { getFeatures, submitNewPin } from '@onboarding-actions/connectActions';
import { PinMatrix, Text, Wrapper, OnboardingButton } from '@onboarding-components';
import { Dispatch, AppState } from '@suite-types';
import l10nMessages from './index.messages';
import Reconnect from './components/Reconnect';
import IsSameDevice from './components/IsSameDevice';

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
        <FormattedMessage {...l10nMessages.TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER} />
    </P>
);

interface IsDeviceRequestingPinProps {
    submitNewPin: typeof submitNewPin;
    uiInteraction: AppState['onboarding']['uiInteraction'];
}

const IsDeviceRequestingPin = ({ submitNewPin, uiInteraction }: IsDeviceRequestingPinProps) => {
    if (!uiInteraction.counter) return null;
    return (
        <>
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
            <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING} />
        </H2>
        <P>
            <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT} />
        </P>
        <Wrapper.Controls>
            <OnboardingButton.Cta onClick={actionCta}>
                <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON} />
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
    if (!uiInteraction.counter) {
        return null;
    }
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
        default:
            return <UnexpectedStateCommon>Error: {caseType}</UnexpectedStateCommon>;
    }
};

export default connect(
    null,
    mapDispatchToProps,
)(UnexpectedState);
