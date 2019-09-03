import React from 'react';
import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import * as STEP from '@onboarding-constants/steps';
import { getRoute } from '@suite-utils/router';
import { OnboardingButton, Text, Option, Wrapper } from '@onboarding-components';
import { Props } from './Container';
import l10nMessages from './index.messages';

const Small = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    margin-bottom: 5px;
`;

const Base = styled.div`
    font-size: ${variables.FONT_SIZE.BASE};
    margin-bottom: 5px;
`;

const WelcomeStep = (props: Props) => {
    const { suite } = props;

    const isDeviceInitialized = () => {
        return suite.device && suite.device.features && suite.device.features.initialized;
    };

    return (
        <Wrapper.Step data-test="onboarding_first_page">
            <Wrapper.StepBody>
                <H1>
                    <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR} />
                </H1>

                <Text>
                    <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR_TEXT} />
                </Text>

                <Wrapper.Options>
                    <Option
                        data-test="button-path-create"
                        onClick={() => {
                            props.onboardingActions.addPath(STEP.PATH_CREATE);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        <Base>Create new Wallet</Base>
                        <Small>if you never had any Wallet</Small>
                        <OnboardingButton.Cta>Create a new Wallet</OnboardingButton.Cta>
                    </Option>
                    <Option
                        data-test="button-path-recovery"
                        onClick={() => {
                            props.onboardingActions.addPath(STEP.PATH_RECOVERY);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        <Base>Restore existing wallet</Base>
                        <Small>using your backup seed</Small>
                        <OnboardingButton.Alt>Restore existing</OnboardingButton.Alt>
                    </Option>
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                {isDeviceInitialized() && (
                    <OnboardingButton.Back
                        data-test="button-use-wallet"
                        onClick={() => props.goto(getRoute('wallet-index'))}
                    >
                        <FormattedMessage {...l10nMessages.TR_USE_WALLET_NOW} />
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default WelcomeStep;
