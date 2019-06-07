import React from 'react';
import styled from 'styled-components';
import { H4, P, Button, Checkbox, Icon, Link, Prompt } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import colors from '@suite/config/onboarding/colors';
import { SEED_MANUAL_URL } from '@suite/config/onboarding/urls';
import { WIPE_DEVICE, BACKUP_DEVICE } from '@suite/actions/onboarding/constants/calls';
import * as STEP from '@suite/constants/onboarding/steps';
import Text from '@suite/components/onboarding/Text';
import l10nCommonMessages from '@suite/support/commonMessages';

import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
    CheckboxWrapper,
} from '@suite/components/onboarding/Wrapper';

import { OnboardingReducer, OnboardingActions } from '@suite/types/onboarding/onboarding';
import { ConnectReducer, ConnectActions } from '@suite/types/onboarding/connect';
import { SeedCardModelT } from './components/SeedCard';
// import BackupModelOne from './components/BackupModelOne';
import l10nMessages from './index.messages';

const Panel = styled.div`
    background-color: ${colors.grayLight};
    color: ${colors.grayDark};
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
`;

const Icons = styled.div`
    display: flex;
    flex-direction: row;
    width: 90%;
    justify-content: space-around;
    margin-top: 10px;
    margin-bottom: 10px;
`;

const Instruction = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

interface State {
    userUnderstands: boolean;
}

interface Props {
    device: ConnectReducer['device'];
    deviceCall: ConnectReducer['deviceCall'];
    deviceInteraction: ConnectReducer['deviceInteraction'];
    activeSubStep: OnboardingReducer['activeSubStep'];
    connectActions: ConnectActions;
    onboardingActions: OnboardingActions;
}

class BackupStep extends React.Component<Props, State> {
    static readonly STARTED_STATUS = 'started';

    static readonly FAILED_STATUS = 'failed';

    static readonly INITIAL_STATUS = 'initial';

    static readonly SUCCESS_STATUS = 'success';

    state: State = {
        userUnderstands: false,
    };

    interval: NodeJS.Timer;

    componentDidMount() {
        this.props.connectActions.resetCall();
    }

    getStatus() {
        const { device, deviceCall, deviceInteraction, activeSubStep } = this.props;
        if (
            (deviceCall!.name === BACKUP_DEVICE && deviceCall.error) ||
            device!.features!.no_backup === true ||
            device!.features!.initialized === false
        ) {
            return BackupStep.FAILED_STATUS;
        }
        if (device && device.features.needs_backup === false) {
            return BackupStep.SUCCESS_STATUS;
        }
        if (device && device.features.needs_backup === true && deviceInteraction.counter > 0) {
            return BackupStep.STARTED_STATUS;
        }
        if (activeSubStep === 'recovery-card-front' || activeSubStep === 'recovery-card-back') {
            return activeSubStep;
        }
        if (device && device.features.needs_backup && !deviceCall.isProgress) {
            return BackupStep.INITIAL_STATUS;
        }
        return null;
    }

    async wipeDeviceAndStartAgain() {
        this.props.connectActions.callActionAndGoToNextStep(WIPE_DEVICE, null, STEP.ID_START_STEP);
    }

    render() {
        const { device, onboardingActions, deviceInteraction } = this.props;

        return (
            <StepWrapper>
                <StepHeadingWrapper>
                    {this.getStatus() === BackupStep.INITIAL_STATUS && 'Backup your device'}
                    {this.getStatus() === BackupStep.SUCCESS_STATUS && 'Backup finished'}
                    {this.getStatus() === BackupStep.FAILED_STATUS && 'Backup failed'}
                    {this.getStatus() === BackupStep.STARTED_STATUS &&
                        deviceInteraction.counter <= 24 &&
                        'Write down seed words from your device'}
                    {this.getStatus() === BackupStep.STARTED_STATUS &&
                        deviceInteraction.counter > 24 &&
                        'Check seed words'}
                    {this.getStatus() === 'recovery-card-front' && 'Get your recovery card'}
                    {this.getStatus() === 'recovery-card-back' && 'Get your recovery card'}
                </StepHeadingWrapper>
                <StepBodyWrapper>
                    {this.getStatus() === BackupStep.INITIAL_STATUS && (
                        <React.Fragment>
                            <P>
                                <FormattedMessage
                                    {...l10nMessages.TR_BACKUP_SUBHEADING_1}
                                    values={{
                                        TR_SEED_MANUAL_LINK: (
                                            <Link href={SEED_MANUAL_URL}>
                                                <FormattedMessage
                                                    {...l10nMessages.TR_SEED_MANUAL_LINK}
                                                />
                                            </Link>
                                        ),
                                    }}
                                />
                            </P>
                            <P>
                                <FormattedMessage {...l10nMessages.TR_BACKUP_SUBHEADING_2} />
                            </P>

                            {/* todo: refactor icons to components */}
                            <Icons>
                                <Instruction>
                                    <Icon
                                        size={80}
                                        icon={{
                                            paths: [
                                                'm2.515 20.899-1.414-1.414.676-.677c-1.084-.92-1.777-2.29-1.777-3.808 0-2.64 2.05-4.78 4.65-4.97.68-3.44 3.71-6.03 7.35-6.03 1.322 0 2.564.343 3.642.944l3.843-3.843 1.414 1.414zm16.135-12.869c3.01.33 5.35 2.87 5.35 5.97 0 3.29-2.71 6-6 6h-11.615l11.962-11.962c.114-.005.215-.008.303-.008z',
                                            ],
                                            viewBox: '0 0 24 24',
                                            ratio: 1,
                                        }}
                                    />
                                    <FormattedMessage
                                        {...l10nMessages.TR_DO_NOT_UPLOAD_INSTRUCTION}
                                    />
                                </Instruction>

                                <Instruction>
                                    <Icon
                                        size={80}
                                        icon={{
                                            paths: [
                                                'm2.515 20.899-1.414-1.414.967-.967c-.044-.165-.068-.339-.068-.518v-13c0-1.11.89-2 2-2h6l2 2h3.586l3.899-3.899 1.414 1.414zm18.558-15.587c.557.355.927.978.927 1.688v11c0 1.105-.895 2-2 2h-13.615l6.182-6.183 3.433 3.433 4.25-4.25h-3.25v-3.615zm-7.688 7.688 1.615-1.615v1.615z',
                                            ],
                                            viewBox: '0 0 24 24',
                                            ratio: 1,
                                        }}
                                    />
                                    <FormattedMessage
                                        {...l10nMessages.TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION}
                                    />
                                </Instruction>

                                <Instruction>
                                    <Icon
                                        size={80}
                                        icon={{
                                            paths: [
                                                'm2.515 20.899-1.414-1.414.967-.967c-.044-.165-.068-.339-.068-.518v-12c0-1.105.895-2 2-2h3l2-2h6l1.793 1.793 2.692-2.692 1.414 1.414zm19.079-16.108c.255.336.406.755.406 1.209v12c0 1.105-.895 2-2 2h-13.615l3.478-3.478c.648.306 1.372.478 2.137.478 2.761 0 5-2.239 5-5 0-.765-.172-1.489-.478-2.137zm-10.157 10.156 3.51-3.51c.035.183.053.371.053.563 0 1.657-1.343 3-3 3-.192 0-.38-.018-.563-.053zm-4.241-1.557 1.837-1.837c.194-1.299 1.221-2.326 2.52-2.52l1.837-1.837c-.441-.128-.908-.196-1.39-.196-2.761 0-5 2.239-5 5 0 .482.068.949.196 1.39z',
                                            ],
                                            viewBox: '0 0 24 24',
                                            ratio: 1,
                                        }}
                                    />
                                    <FormattedMessage
                                        {...l10nMessages.TR_DO_NOT_TAKE_PHOTO_INSTRUCTION}
                                    />
                                </Instruction>
                            </Icons>

                            <Panel>
                                <P>
                                    <FormattedMessage
                                        {...l10nMessages.TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE}
                                    />
                                </P>
                            </Panel>
                            <CheckboxWrapper>
                                <Checkbox
                                    isChecked={this.state.userUnderstands}
                                    onClick={() =>
                                        this.setState(prevState => ({
                                            userUnderstands: !prevState.userUnderstands,
                                        }))
                                    }
                                >
                                    <P>
                                        <FormattedMessage
                                            {...l10nMessages.TR_I_HAVE_READ_INSTRUCTIONS}
                                        />
                                    </P>
                                </Checkbox>
                            </CheckboxWrapper>

                            <ControlsWrapper>
                                <Button
                                    onClick={() => {
                                        this.props.onboardingActions.goToSubStep(
                                            'recovery-card-front',
                                        );
                                    }}
                                    isDisabled={!device || !this.state.userUnderstands}
                                >
                                    Continue
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {this.getStatus() === 'recovery-card-front' && (
                        <React.Fragment>
                            <Text>
                                This is your recovery card. You should find two of them in the
                                package. In few moments, this piece of paper will become more
                                important than your device.
                            </Text>
                            <SeedCardModelT flipOnMouseOver />
                            <ControlsWrapper>
                                <Button
                                    // onClick={() => this.setState({ showWords: true })}
                                    onClick={() => {
                                        this.props.onboardingActions.goToSubStep(
                                            'recovery-card-back',
                                        );
                                    }}
                                >
                                    Flip it
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {this.getStatus() === 'recovery-card-back' && (
                        <React.Fragment>
                            <Text>
                                Device will show you a secret sequence of words. You should write
                                them down here.
                            </Text>
                            <SeedCardModelT
                                showBack
                                wordsNumber={device!.features!.major_version === 2 ? 12 : 24}
                            />
                            <ControlsWrapper>
                                <Button
                                    onClick={() => {
                                        this.props.connectActions.backupDevice();
                                    }}
                                >
                                    <FormattedMessage {...l10nMessages.TR_START_BACKUP} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {this.getStatus() === BackupStep.STARTED_STATUS && (
                        <React.Fragment>
                            <SeedCardModelT
                                showBack
                                wordsNumber={24}
                                words={Array.from(
                                    Array(
                                        deviceInteraction.counter < 24
                                            ? deviceInteraction.counter - 1
                                            : 24,
                                    ),
                                ).map(() => '*****')}
                                checkingWordNumber={
                                    deviceInteraction.counter - 24 > 0
                                        ? deviceInteraction.counter - 24
                                        : null
                                }
                                writingWordNumber={
                                    deviceInteraction.counter <= 24
                                        ? deviceInteraction.counter
                                        : null
                                }
                            />
                            <div style={{ marginTop: '100px' }}>
                                <Prompt model={device!.features.major_version} size={32}>
                                    {deviceInteraction.counter > 24 && (
                                        <Text>
                                            Check the {deviceInteraction.counter - 24}. word on your
                                            device
                                        </Text>
                                    )}
                                    {deviceInteraction.counter <= 24 && (
                                        <Text>
                                            Write down the {deviceInteraction.counter}. word from
                                            your device
                                        </Text>
                                    )}
                                </Prompt>
                            </div>
                        </React.Fragment>
                    )}

                    {this.getStatus() === BackupStep.FAILED_STATUS && (
                        <React.Fragment>
                            <H4>
                                <FormattedMessage
                                    {...l10nMessages.TR_DEVICE_DISCONNECTED_DURING_ACTION}
                                />
                            </H4>
                            <P>
                                <FormattedMessage
                                    {...l10nMessages.TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION}
                                />
                            </P>
                            <ControlsWrapper>
                                {device!.features!.initialized === true && (
                                    <Button
                                        onClick={() => {
                                            this.props.connectActions.wipeDevice();
                                        }}
                                        isDisabled={!device || !device.connected}
                                    >
                                        <FormattedMessage {...l10nCommonMessages.TR_WIPE_DEVICE} />
                                    </Button>
                                )}

                                {device!.features!.initialized === false && (
                                    <Button
                                        onClick={() => {
                                            this.props.connectActions.resetDevice();
                                        }}
                                        isDisabled={!device || !device.connected}
                                    >
                                        <FormattedMessage {...l10nCommonMessages.TR_RESET_DEVICE} />
                                    </Button>
                                )}
                            </ControlsWrapper>
                            {(!device || !device.connected) && (
                                <Text>
                                    <FormattedMessage
                                        {...l10nCommonMessages.TR_CONNECT_YOUR_DEVICE}
                                    />
                                </Text>
                            )}
                        </React.Fragment>
                    )}

                    {this.getStatus() === BackupStep.SUCCESS_STATUS && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_BACKUP_FINISHED_TEXT} />
                            </Text>

                            <ControlsWrapper>
                                <Button onClick={() => onboardingActions.goToNextStep()}>
                                    <FormattedMessage {...l10nMessages.TR_BACKUP_FINISHED_BUTTON} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default BackupStep;
