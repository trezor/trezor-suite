import React from 'react';
// import { FormattedMessage } from 'react-intl';
import { Link } from '@trezor/components';
import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, Option, OnboardingButton } from '@onboarding-components';
import { URLS } from '@onboarding-constants';
// import l10nMessages from './index.messages';
import { Props } from './Container';

const ShamirStep = (props: Props) => {
    const { device } = props;

    // this step expects device
    if (!device || !device.features) {
        return null;
    }

    const getModel = () => {
        return device.features.major_version;
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getModel() === 1 && 'Almost there! Prepare to launch'}
                {getModel() === 2 && 'Seed type'}
                {/* <FormattedMessage {...l10nMessages.TR_SECURITY_HEADING} /> */}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {getModel() === 1 && (
                    <Text>
                        You are one step from creating your wallet. By clicking the button below you
                        agree with{' '}
                        <Link href={URLS.TOS_URL} variant="nostyle">
                            TOS
                        </Link>
                    </Text>
                )}
                {getModel() === 2 && (
                    <Text>You might chose either standard backup type or shamir backups</Text>
                )}

                {getModel() === 2 && (
                    <Wrapper.Options>
                        <Option
                            data-test="@onboarding/button-standard-backup"
                            onClick={() => {
                                props.setBackupType(0);
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                );
                            }}
                        >
                            <Text>Standard backup</Text>
                        </Option>

                        <Option
                            data-test="button-shamir-backup"
                            onClick={() => {
                                props.setBackupType(1);
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                );
                            }}
                        >
                            <Text>Shamir backup</Text>
                        </Option>
                    </Wrapper.Options>
                )}
                {getModel() === 1 && (
                    <Wrapper.Controls>
                        <OnboardingButton.Cta
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                )
                            }
                        >
                            Create the wallet
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back onClick={() => props.goToPreviousStep()}>
                    Back
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default ShamirStep;
