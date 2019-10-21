import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { H4, P, Button, Checkbox, Icon, Link, Prompt } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import colors from '@suite/config/onboarding/colors';
import { SEED_MANUAL_URL } from '@suite/constants/onboarding/urls';
import { BACKUP_DEVICE } from '@suite/actions/onboarding/constants/calls';
import l10nCommonMessages from '@suite-support/Messages';

import { Wrapper, Text } from '@onboarding-components';
import { SeedCard } from './components/SeedCard';
import { Props } from './Container';
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

const PromptWrapper = styled.div`
    margin-top: auto;
`;

const BackupStep = (props: Props) => {
    const { device, deviceCall, uiInteraction, activeSubStep } = props;

    const [userUnderstands, setUserUnderstands] = useState(false);

    useEffect(() => {
        props.connectActions.resetCall();
    }, [props.connectActions]);

    if (!device || !device.features) {
        return null;
    }

    const getStatus = () => {
        if (
            (deviceCall.name === BACKUP_DEVICE && deviceCall.error) ||
            device.features.no_backup === true ||
            device.features.initialized === false
        ) {
            return 'failed';
        }
        if (device && device.features.needs_backup === false) {
            return 'success';
        }
        if (
            device &&
            device.features.needs_backup === true &&
            typeof uiInteraction.counter === 'number'
        ) {
            return 'started';
        }
        if (activeSubStep === 'recovery-card-front' || activeSubStep === 'recovery-card-back') {
            return activeSubStep;
        }
        if (device && device.features.needs_backup && !deviceCall.isProgress) {
            return 'initial';
        }
        return null;
    };

    // TODO: rework this step to 2 separate components for T1 and T2, this is mess.
    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getStatus() === 'initial' && 'Backup your device'}
                {getStatus() === 'success' && 'Backup finished'}
                {getStatus() === 'failed' && 'Backup failed'}
                {getStatus() === 'started' &&
                    device &&
                    device.features &&
                    device.features.major_version === 1 &&
                    typeof uiInteraction.counter === 'number' &&
                    uiInteraction.counter < 24 &&
                    'Write down seed words from your device'}
                {getStatus() === 'started' &&
                    typeof uiInteraction.counter === 'number' &&
                    uiInteraction.counter >= 24 &&
                    'Check seed words'}
                {getStatus() === 'recovery-card-front' && 'Get your recovery card'}
                {getStatus() === 'recovery-card-back' && 'Get your recovery card'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {getStatus() === 'initial' && (
                    <>
                        <P>
                            <FormattedMessage
                                {...l10nMessages.TR_BACKUP_SUBHEADING_1}
                                values={{
                                    TR_SEED_MANUAL_LINK: (
                                        <Link href={SEED_MANUAL_URL} variant="nostyle">
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
                                <Icon size={80} icon="CLOUD_CROSSED" />
                                <Text>
                                    <FormattedMessage
                                        {...l10nMessages.TR_DO_NOT_UPLOAD_INSTRUCTION}
                                    />
                                </Text>
                            </Instruction>

                            <Instruction>
                                <Icon size={80} icon="DOWNLOAD_CROSSED" />
                                <Text>
                                    <FormattedMessage
                                        {...l10nMessages.TR_DO_NOT_SAFE_IN_COMPUTER_INSTRUCTION}
                                    />
                                </Text>
                            </Instruction>

                            <Instruction>
                                <Icon size={80} icon="PHOTO_CROSSED" />
                                <Text>
                                    <FormattedMessage
                                        {...l10nMessages.TR_DO_NOT_TAKE_PHOTO_INSTRUCTION}
                                    />
                                </Text>
                            </Instruction>
                        </Icons>

                        <Panel>
                            <P>
                                <FormattedMessage
                                    {...l10nMessages.TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE}
                                />
                            </P>
                        </Panel>
                        <Wrapper.Checkbox>
                            <Checkbox
                                isChecked={userUnderstands}
                                onClick={() => setUserUnderstands(!userUnderstands)}
                            >
                                <P>
                                    <FormattedMessage
                                        {...l10nMessages.TR_I_HAVE_READ_INSTRUCTIONS}
                                    />
                                </P>
                            </Checkbox>
                        </Wrapper.Checkbox>

                        <Wrapper.Controls>
                            {device.features.major_version === 1 && (
                                <Button
                                    onClick={() => {
                                        props.onboardingActions.goToSubStep('recovery-card-front');
                                    }}
                                    isDisabled={!device || !userUnderstands}
                                >
                                    Continue
                                </Button>
                            )}

                            {device.features.major_version === 2 && (
                                <Button
                                    onClick={() => props.connectActions.backupDevice()}
                                    isDisabled={!device || !userUnderstands}
                                >
                                    <FormattedMessage {...l10nMessages.TR_START_BACKUP} />
                                </Button>
                            )}
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'recovery-card-front' && (
                    <>
                        <Text>
                            This is your recovery card. You should find two of them in the package.
                            In few moments, this piece of paper will become more important than your
                            device.
                        </Text>
                        <SeedCard flipOnMouseOver counter={uiInteraction.counter} />
                        <Wrapper.Controls>
                            <Button
                                // onClick={() =>  setState({ showWords: true })}
                                onClick={() => {
                                    props.onboardingActions.goToSubStep('recovery-card-back');
                                }}
                            >
                                Flip it
                            </Button>
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'recovery-card-back' && (
                    <>
                        <Text>
                            Device will show you a secret sequence of words. You should write them
                            down here.
                        </Text>
                        <SeedCard showBack counter={uiInteraction.counter} />
                        <Wrapper.Controls>
                            <Button
                                onClick={() => {
                                    props.connectActions.backupDevice();
                                }}
                            >
                                <FormattedMessage {...l10nMessages.TR_START_BACKUP} />
                            </Button>
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'started' && device.features.major_version === 1 && (
                    <>
                        <SeedCard showBack counter={uiInteraction.counter} />
                        <PromptWrapper>
                            <Prompt model={device.features.major_version} size={32}>
                                {typeof uiInteraction.counter === 'number' &&
                                    uiInteraction.counter >= 24 && (
                                        <Text>
                                            Check the {uiInteraction.counter - 23}. word on your
                                            device
                                        </Text>
                                    )}
                                {typeof uiInteraction.counter === 'number' &&
                                    uiInteraction.counter < 24 && (
                                        <Text>
                                            Write down the {uiInteraction.counter + 1}. word from
                                            your device
                                        </Text>
                                    )}
                            </Prompt>
                        </PromptWrapper>
                    </>
                )}

                {getStatus() === 'failed' && (
                    <>
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
                        <Wrapper.Controls>
                            {device!.features!.initialized === true && (
                                <Button
                                    onClick={() => {
                                        props.connectActions.wipeDevice();
                                    }}
                                    isDisabled={!device || !device.connected}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_WIPE_DEVICE} />
                                </Button>
                            )}

                            {device!.features!.initialized === false && (
                                <Button
                                    onClick={() => {
                                        props.connectActions.resetDevice();
                                    }}
                                    isDisabled={!device || !device.connected}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_RESET_DEVICE} />
                                </Button>
                            )}
                        </Wrapper.Controls>
                        {(!device || !device.connected) && (
                            <Text>
                                <FormattedMessage {...l10nCommonMessages.TR_CONNECT_YOUR_DEVICE} />
                            </Text>
                        )}
                    </>
                )}

                {getStatus() === 'success' && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_BACKUP_FINISHED_TEXT} />
                        </Text>

                        <Wrapper.Controls>
                            <Button onClick={() => props.onboardingActions.goToNextStep()}>
                                <FormattedMessage {...l10nMessages.TR_BACKUP_FINISHED_BUTTON} />
                            </Button>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default BackupStep;
