import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components/Translation';
import { BACKUP_DEVICE } from '@onboarding-actions/constants/calls';
import colors from '@onboarding-config/colors';
import { SEED_MANUAL_URL } from '@suite-constants/urls';
import messages from '@suite/support/messages';
import { Checkbox, Prompt } from '@trezor/components';
import { Link, P } from '@trezor/components-v2';
import React, { useState } from 'react';
import styled from 'styled-components';

import Instructions from './components/Instructions';
import SeedCard from './components/SeedCard';
import { Props } from './Container';

const Panel = styled(P)`
    background-color: ${colors.grayLight};
    color: ${colors.grayDark};
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
`;

const PromptWrapper = styled.div`
    margin-top: 30px;
`;

const BackupStep = (props: Props) => {
    const { device, deviceCall, uiInteraction, activeSubStep } = props;

    const [userUnderstands, setUserUnderstands] = useState(false);

    if (!device || !device.features) {
        return null;
    }

    const { features } = device;
    const model = features.major_version;

    const getStatus = () => {
        if (features.initialized === false || features.unfinished_backup) {
            return 'failed';
        }
        if (features.needs_backup === false && !deviceCall.isProgress) {
            return 'success';
        }
        if (
            features.needs_backup &&
            typeof uiInteraction.counter === 'number' &&
            deviceCall.name === BACKUP_DEVICE
        ) {
            return 'started';
        }
        if (
            activeSubStep &&
            ['recovery-card-front', 'recovery-card-back'].includes(activeSubStep) &&
            !deviceCall.isProgress
        ) {
            return activeSubStep;
        }
        if (features.needs_backup && !deviceCall.isProgress) {
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
                    model === 1 &&
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
                            <Translation
                                {...messages.TR_BACKUP_SUBHEADING_1}
                                values={{
                                    TR_SEED_MANUAL_LINK: (
                                        <Link href={SEED_MANUAL_URL}>
                                            <Translation {...messages.TR_SEED_MANUAL_LINK} />
                                        </Link>
                                    ),
                                }}
                            />
                        </P>
                        <P>
                            <Translation {...messages.TR_BACKUP_SUBHEADING_2} />
                        </P>

                        <Instructions />

                        <Panel>
                            <Translation {...messages.TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE} />
                        </Panel>
                        <Wrapper.Checkbox>
                            <Checkbox
                                isChecked={userUnderstands}
                                onClick={() => setUserUnderstands(!userUnderstands)}
                            >
                                <P>
                                    <Translation {...messages.TR_I_HAVE_READ_INSTRUCTIONS} />
                                </P>
                            </Checkbox>
                        </Wrapper.Checkbox>

                        <Wrapper.Controls>
                            {model === 1 && (
                                <OnboardingButton.Cta
                                    onClick={() => {
                                        props.goToSubStep('recovery-card-front');
                                    }}
                                    isDisabled={!device || !userUnderstands}
                                >
                                    Continue
                                </OnboardingButton.Cta>
                            )}

                            {model === 2 && (
                                <OnboardingButton.Cta
                                    onClick={() => props.backupDevice()}
                                    isDisabled={!device || !userUnderstands}
                                >
                                    <Translation {...messages.TR_START_BACKUP} />
                                </OnboardingButton.Cta>
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
                            <OnboardingButton.Cta
                                onClick={() => {
                                    props.goToSubStep('recovery-card-back');
                                }}
                            >
                                Flip it
                            </OnboardingButton.Cta>
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
                            <OnboardingButton.Cta
                                onClick={() => {
                                    props.backupDevice();
                                }}
                            >
                                <Translation {...messages.TR_START_BACKUP} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'started' && model === 1 && (
                    <>
                        <SeedCard showBack counter={uiInteraction.counter} />
                        <PromptWrapper>
                            <Prompt model={model} size={32}>
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
                        <P>
                            <Translation
                                {...messages.TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION}
                            />
                        </P>

                        <P>Once you click retry, device will ask you to confirm these steps:</P>
                        <P>1. wipe device</P>
                        <P>2. create new wallet</P>
                        <P>3. start backup again</P>

                        <Wrapper.Controls>
                            {!deviceCall.isProgress && (
                                <>
                                    <OnboardingButton.Cta
                                        onClick={() => {
                                            props.retryBackup();
                                        }}
                                        isDisabled={!device || !device.connected}
                                    >
                                        <Translation {...messages.TR_RETRY} />
                                    </OnboardingButton.Cta>
                                    <OnboardingButton.Alt
                                        onClick={() => {
                                            props.goto('wallet-index');
                                        }}
                                        isDisabled={!device || !device.connected}
                                    >
                                        Go to wallet
                                    </OnboardingButton.Alt>
                                </>
                            )}
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'success' && (
                    <>
                        <Text>
                            <Translation {...messages.TR_BACKUP_FINISHED_TEXT} />
                        </Text>

                        <Wrapper.Controls>
                            <OnboardingButton.Cta onClick={() => props.goToNextStep()}>
                                <Translation {...messages.TR_BACKUP_FINISHED_BUTTON} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default BackupStep;
