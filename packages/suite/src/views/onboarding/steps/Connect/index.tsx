import React from 'react';
import ReactTimeout, { ReactTimeoutProps } from 'react-timeout';
import { H4, Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

// import { TrezorConnect } from '@suite/components/onboarding/Prompts';
import { Dots } from '@suite/components/onboarding/Loaders';
import Text from '@suite/components/onboarding/Text';
import l10nCommonMessages from '@suite/support/commonMessages';
import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';
import { OnboardingActions, OnboardingReducer } from '@suite/types/onboarding/onboarding';
import { ConnectActions, ConnectReducer } from '@suite/types/onboarding/connect';

import TroubleshootBootloader from './components/TroubleshootBootloader';
import TroubleshootInitialized from './components/TroubleshootInitialized';
import TroubleshootSearchingTooLong from './components/TroubleshootTooLong';
import l10nMessages from './index.messages';

interface Props {
    onboardingActions: OnboardingActions;
    activeSubStep: OnboardingReducer['activeSubStep'];
    device: ConnectReducer['device'];
    connectActions: ConnectActions;
    deviceCall: ConnectReducer['deviceCall'];
    isResolved: boolean;
    model: number;
}

interface State {
    isSearching: boolean;
    isSearchingTooLong: boolean;
}

class ConnectStep extends React.PureComponent<Props & ReactTimeoutProps, State> {
    static readonly IS_SEARCHING_TIMEOUT = 5 * 1000;

    static readonly IS_SEARCHING_TOO_LONG_TIMEOUT = 15 * 1000;

    state: State = {
        isSearching: false,
        isSearchingTooLong: false,
    };

    componentDidMount() {
        if (
            this.props.device === null ||
            (this.props.device && this.props.device.connected === false)
        ) {
            this.props.setTimeout(
                () => this.setState({ isSearching: true }),
                ConnectStep.IS_SEARCHING_TIMEOUT,
            );
            this.props.setTimeout(
                () => this.setState({ isSearchingTooLong: true }),
                ConnectStep.IS_SEARCHING_TOO_LONG_TIMEOUT,
            );
        }
    }

    componentWillReceiveProps(nextProps: Props & ReactTimeoutProps) {
        if (this.props.device && nextProps.device.connected === false) {
            this.setState({ isSearching: true });
            this.props.setTimeout(() => this.setState({ isSearchingTooLong: true }), 15 * 1000);
        } else {
            this.setState({ isSearchingTooLong: false });
        }
    }

    isInBlWithFwPresent() {
        const { device } = this.props;
        if (!device) {
            return null;
        }
        return device.mode === 'bootloader' && device.features.firmware_present === true;
    }

    render() {
        const deviceIsConnected = Boolean(this.props.device && this.props.device.connected);
        const {
            device,
            deviceCall,
            connectActions,
            onboardingActions,
            activeSubStep,
            isResolved,
        } = this.props;
        const { isSearching, isSearchingTooLong } = this.state;
        return (
            <StepWrapper>
                <StepHeadingWrapper>
                    <FormattedMessage {...l10nMessages.TR_CONNECT_HEADING} />
                </StepHeadingWrapper>
                <StepBodyWrapper>
                    {/* <TrezorConnect model={this.props.model} height={180} loop={!deviceIsConnected} /> */}

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
                            {!device.features.initialized && this.isInBlWithFwPresent() === false && (
                                <React.Fragment>
                                    <H4>
                                        <FormattedMessage {...l10nMessages.TR_DEVICE_DETECTED} />
                                    </H4>
                                    <Text>
                                        <FormattedMessage {...l10nMessages.TR_FOUND_OK_DEVICE} />
                                    </Text>
                                    <ControlsWrapper>
                                        <Button
                                            onClick={() =>
                                                this.props.onboardingActions.goToNextStep()
                                            }
                                        >
                                            <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                        </Button>
                                    </ControlsWrapper>
                                </React.Fragment>
                            )}

                            {this.isInBlWithFwPresent() && <TroubleshootBootloader />}

                            {device.features.initialized && !isResolved && (
                                <TroubleshootInitialized
                                    device={device}
                                    connectActions={connectActions}
                                    onboardingActions={onboardingActions}
                                    activeSubStep={activeSubStep}
                                />
                            )}

                            {device.features.initialized && isResolved && (
                                <React.Fragment>
                                    <H4>
                                        <FormattedMessage {...l10nMessages.TR_DEVICE_DETECTED} />
                                    </H4>
                                    <Text>Found a device you have previously initialized</Text>
                                    <ControlsWrapper>
                                        <Button
                                            onClick={() =>
                                                this.props.onboardingActions.goToNextStep()
                                            }
                                        >
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
    }
}

export default ReactTimeout(ConnectStep);
