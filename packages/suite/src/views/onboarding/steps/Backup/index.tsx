import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { H4, P, Button, Checkbox, Link, Prompt } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import colors from '@suite/config/onboarding/colors';
import { SEED_MANUAL_URL } from '@suite/constants/onboarding/urls';
import { BACKUP_DEVICE } from '@suite/actions/onboarding/constants/calls';
import l10nCommonMessages from '@suite-support/Messages';

import { Wrapper, Text } from '@onboarding-components';
import SeedCard from './components/SeedCard';
import Instructions from './components/Instructions';
import { Props } from './Container';
import l10nMessages from './index.messages';

const Panel = styled(P)`
    background-color: ${colors.grayLight};
    color: ${colors.grayDark};
    padding: 15px;
    margin-top: 10px;
    margin-bottom: 10px;
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

    const { features } = device;
    const model = features.major_version;

    const getStatus = () => {
        if (
            (deviceCall.name === BACKUP_DEVICE && deviceCall.error) ||
            features.no_backup === true ||
            features.initialized === false
        ) {
            return 'failed';
        }
        if (features.needs_backup === false) {
            return 'success';
        }
        if (features.needs_backup === true && typeof uiInteraction.counter === 'number') {
            return 'started';
        }
        if (activeSubStep === 'recovery-card-front' || activeSubStep === 'recovery-card-back') {
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

                        <Instructions />

                        <Panel>
                            <FormattedMessage
                                {...l10nMessages.TR_SATOSHILABS_CANNOT_BE_HELD_RESPONSIBLE}
                            />
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
                            {model === 1 && (
                                <Button
                                    onClick={() => {
                                        props.onboardingActions.goToSubStep('recovery-card-front');
                                    }}
                                    isDisabled={!device || !userUnderstands}
                                >
                                    Continue
                                </Button>
                            )}

                            {model === 2 && (
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
                            {features.initialized === true && (
                                <Button
                                    onClick={async () => {
                                        await props.connectActions.wipeDevice();
                                        await props.connectActions.getFeatures();
                                        props.connectActions.resetDevice();
                                    }}
                                    isDisabled={!device || !device.connected}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_WIPE_DEVICE} />
                                </Button>
                            )}

                            {features.initialized === false && (
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
                        {!device.connected && (
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
