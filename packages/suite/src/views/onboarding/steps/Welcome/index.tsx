import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import * as STEP from '@onboarding-constants/steps';
import CONFIG from '@onboarding-config';
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
    const { device } = props;

    const shouldDisplayLeaveButton = () => {
        if (device && device.features && !device.features.initialized) {
            return false;
        }
        // rather show than not
        return true;
    };

    return (
        <Wrapper.Step data-test="onboarding_first_page">
            <Wrapper.StepBody>
                <Wrapper.StepHeading>
                    <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR} />
                </Wrapper.StepHeading>

                <Text>
                    <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR_TEXT} />
                </Text>

                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/button-path-create"
                        onClick={() => {
                            props.addPath(STEP.PATH_CREATE);
                            props.goToNextStep();
                        }}
                    >
                        <Base>Create new Wallet</Base>
                        <Small>if you never had any Wallet</Small>
                        <OnboardingButton.Cta>Create a new Wallet</OnboardingButton.Cta>
                    </Option>
                    <Option
                        data-test="button-path-recovery"
                        onClick={() => {
                            props.addPath(STEP.PATH_RECOVERY);
                            props.goToNextStep();
                        }}
                    >
                        <Base>Restore existing wallet</Base>
                        <Small>using your backup seed</Small>

                        <OnboardingButton.Alt>Restore existing</OnboardingButton.Alt>
                    </Option>
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                {shouldDisplayLeaveButton() && (
                    <OnboardingButton.Back
                        data-test="button-use-wallet"
                        onClick={() => props.exitApp(CONFIG.APP.EXIT_APP_ROUTE)}
                    >
                        <FormattedMessage {...l10nMessages.TR_USE_WALLET_NOW} />
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default WelcomeStep;
