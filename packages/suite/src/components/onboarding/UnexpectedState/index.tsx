import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { P, H2, Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as STEP from '@suite/constants/onboarding/steps';
import { ConnectReducer } from '@suite/types/onboarding/connect';
import { AnyStepDisallowedState } from '@suite/types/onboarding/steps';
import { getFeatures, submitNewPin } from '@onboarding-actions/connectActions';
import { PinMatrix, Text, Wrapper } from '@onboarding-components';
import { Dispatch } from '@suite-types';
import l10nMessages from './index.messages';
import Reconnect from './Reconnect';

const CommonWrapper = styled.div`
    margin: auto 30px auto 30px;
    text-align: center;
    width: 100%;
`;

const UnexpectedStateCommon: React.SFC = ({ children }) => (
    <CommonWrapper>{children}</CommonWrapper>
);

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
    submitNewPin: typeof submitNewPin;
    uiInteraction: ConnectReducer['uiInteraction'];
}

const IsDeviceRequestingPin: FunctionComponent<IsDeviceRequestingPinProps> = ({
    submitNewPin,
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
                submitNewPin({ pin });
            }}
        />
    </React.Fragment>
);

interface DeviceIsUsedHereProps {
    getFeatures: typeof getFeatures;
}

const DeviceIsUsedHere: FunctionComponent<DeviceIsUsedHereProps> = ({ getFeatures }) => (
    <React.Fragment>
        <H2>
            <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING} />
        </H2>
        <P>
            <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT} />
        </P>
        <Wrapper.Controls>
            <Button onClick={getFeatures}>
                <FormattedMessage {...l10nMessages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON} />
            </Button>
        </Wrapper.Controls>
    </React.Fragment>
);

interface UnexpectedStateProps {
    caseType: AnyStepDisallowedState;
    model: number;
    getFeatures: typeof getFeatures;
    submitNewPin: typeof submitNewPin;
    uiInteraction: ConnectReducer['uiInteraction'];
}

const UnexpectedState = ({
    caseType,
    model,
    submitNewPin,
    getFeatures,
    uiInteraction,
}: UnexpectedStateProps) => {
    switch (caseType) {
        case STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED:
            return (
                <UnexpectedStateCommon>
                    <Reconnect model={model} />
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
                    <DeviceIsUsedHere getFeatures={getFeatures} />
                </UnexpectedStateCommon>
            );
        default:
            return <UnexpectedStateCommon>Error: {caseType}</UnexpectedStateCommon>;
    }
};

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getFeatures: bindActionCreators(getFeatures, dispatch),
    submitNewPin: bindActionCreators(submitNewPin, dispatch),
});

export default connect(
    null,
    mapDispatchToProps,
)(UnexpectedState);
