import React, { useState } from 'react';
import styled from 'styled-components';
import { Checkbox } from '@trezor/components';
import { Link, P, variables, colors } from '@trezor/components-v2';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components';

import { SEED_MANUAL_URL } from '@suite-constants/urls';
import messages from '@suite/support/messages';

import { Props } from './Container';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const StyledCheckbox = styled(Checkbox)`
    margin-bottom: 22px;
`;

const CheckboxRight = styled.div`
    text-align: left;
`;

const CheckboxTitle = styled.div`
    /* font-weight: ${FONT_WEIGHT.BOLD}; */
`;

const CheckboxText = styled.div`
    font-size: ${FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    max-width: 360px;
    /* font-weight: ${FONT_WEIGHT.BOLD}; */
`;

interface CheckItemProps {
    title: React.ReactNode;
    description: React.ReactNode;
    isChecked: boolean;
    onClick: () => void;
}

const CheckItem = ({ title, description, isChecked, onClick }: CheckItemProps) => {
    return (
        <StyledCheckbox isChecked={isChecked} onClick={onClick}>
            <CheckboxRight>
                <CheckboxTitle>{title}</CheckboxTitle>
                <CheckboxText>{description}</CheckboxText>
            </CheckboxRight>
        </StyledCheckbox>
    );
};

const BackupStep = (props: Props) => {
    const { device } = props;

    const [checkboxValues, setCheckboxValues] = useState({
        hasTime: false,
        isInPrivate: false,
        understands: false,
    });

    if (!device || !device.features) {
        return null;
    }

    const { features } = device;

    const getStatus = () => {
        if (features.initialized === false || features.unfinished_backup) {
            return 'failed';
        }
        if (features.needs_backup === false) {
            return 'success';
        }
        if (features.needs_backup) {
            return 'initial';
        }
        return null;
    };

    const canStart = () => Object.values(checkboxValues).every(v => v === true);

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getStatus() === 'initial' && 'Create a backup seed'}
                {getStatus() === 'success' && 'Backup finished'}
                {getStatus() === 'failed' && 'Backup failed'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {getStatus() === 'initial' && (
                    <>
                        <Text>
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
                        </Text>

                        <Wrapper.Checkbox>
                            <CheckItem
                                onClick={() =>
                                    setCheckboxValues({
                                        ...checkboxValues,
                                        hasTime: !checkboxValues.hasTime,
                                    })
                                }
                                title="I have enough time to do a backup (few minutes)"
                                description="Once you begin this process you can’t pause it or do it again. Please ensure you have enough time to do this backup."
                                isChecked={checkboxValues.hasTime}
                            />
                            <CheckItem
                                onClick={() =>
                                    setCheckboxValues({
                                        ...checkboxValues,
                                        isInPrivate: !checkboxValues.isInPrivate,
                                    })
                                }
                                title="I am in a safe private or public place away from cameras"
                                description="Make sure no one can peek above your shoulder or there are no cameras watching your screen. Nobody should ever see your seed."
                                isChecked={checkboxValues.isInPrivate}
                            />
                            <CheckItem
                                onClick={() =>
                                    setCheckboxValues({
                                        ...checkboxValues,
                                        understands: !checkboxValues.understands,
                                    })
                                }
                                title="I understand seed is important and I should keep it safe"
                                description="Backup seed is the ultimate key to your Wallet and funds. Once you lose it, it’s gone forever and there is no way to restore lost seed."
                                isChecked={checkboxValues.understands}
                            />
                        </Wrapper.Checkbox>

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => props.backupDevice()}
                                isDisabled={!canStart()}
                            >
                                <Translation {...messages.TR_START_BACKUP} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {getStatus() === 'failed' && (
                    <>
                        <Text>
                            <Translation
                                {...messages.TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION}
                            />
                        </Text>

                        <P>Once you click retry, device will ask you to confirm these steps:</P>
                        <P>1. wipe device</P>
                        <P>2. create new wallet</P>
                        <P>3. start backup again</P>

                        <Wrapper.Controls>
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
