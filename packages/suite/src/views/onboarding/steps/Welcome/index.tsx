import React from 'react';
import styled from 'styled-components';
import { H1, variables } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

// todo reorganize to single import
import Option from '@onboarding-components/Option';
import Text from '@onboarding-components/Text';
import { ButtonBack, ButtonCta, ButtonAlt } from '@onboarding-components/Buttons';
import {
    StepBodyWrapper,
    StepWrapper,
    StepFooterWrapper,
    OptionsWrapper,
} from '@onboarding-components/Wrapper';
import * as STEP from '@onboarding-constants/steps';
import { goToNextStep, addPath } from '@onboarding-actions/onboardingActions';
import { goto } from '@suite-actions/routerActions';
import { getRoute } from '@suite-utils/router';
import { AppState } from '@suite-types';

import l10nMessages from './index.messages';

const Small = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const Base = styled.div`
    font-size: ${variables.FONT_SIZE.BASE};
`;

interface Props {
    onboardingActions: {
        goToNextStep: typeof goToNextStep;
        addPath: typeof addPath;
    };
    suite: AppState['suite'];
}

const WelcomeStep = (props: Props) => {
    const { suite } = props;

    const isDeviceInitialized = () => {
        return suite.device && suite.device.features && suite.device.features.initialized;
    };

    return (
        <StepWrapper data-test="onboarding_first_page">
            {/* {
                TODO: what if connect fails to load
                props.connectError && <Loader>Loading takes too long. But we are still trying. If the problem persist, contact Trezor support</Loader>
            } */}
            <StepBodyWrapper>
                <H1>
                    <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR} />
                </H1>

                <Text>
                    <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR_TEXT} />
                </Text>

                <OptionsWrapper>
                    <Option
                        data-test="button-path-create"
                        onClick={() => {
                            props.onboardingActions.addPath(STEP.PATH_CREATE);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        <Base>Create new Wallet</Base>
                        <Small>if you never had any Wallet</Small>
                        <ButtonCta>Create a new Wallet</ButtonCta>
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
                        <ButtonAlt>Recover an existing wallet</ButtonAlt>
                    </Option>
                </OptionsWrapper>
            </StepBodyWrapper>
            <StepFooterWrapper>
                {isDeviceInitialized() && (
                    <ButtonBack
                        data-test="button-use-wallet"
                        onClick={() => goto(getRoute('wallet-index'))}
                    >
                        <FormattedMessage {...l10nMessages.TR_USE_WALLET_NOW} />
                    </ButtonBack>
                )}
            </StepFooterWrapper>
        </StepWrapper>
    );
};

export default WelcomeStep;
