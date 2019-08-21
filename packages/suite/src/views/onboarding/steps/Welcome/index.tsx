import React, { useEffect, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import styled, { css } from 'styled-components';
import { H1, P, variables } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

// todo reorganize to single import
import Option from '@onboarding-components/Option';
import { Dots } from '@onboarding-components/Loaders';
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

const ANIMATION_DURATION = 2.5;

const TRANSITION_PROPS = {
    classNames: 'fade-out',
    unmountOnExit: true,
};

interface LogoProps {
    isAnimating: boolean;
}

const Logo = styled.svg<LogoProps>`
    display: block;
    margin: 0 auto;
    width: 200px;
    height: 200px;
    opacity: 1;

    ${({ isAnimating }) =>
        isAnimating
            ? css`
                  & .path {
                      animation: animation ${ANIMATION_DURATION}s ease-in;
                  }
              `
            : null}

    @keyframes animation {
        from {
            stroke-dasharray: 30 30;
        }
        to {
            stroke-dasharray: 30 0;
        }
    }
`;

const Loader = styled(P)`
    text-align: center;
`;

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
    const [introTimedout, setIntroTimedout] = useState(false);
    const [introExited, setIntroExited] = useState(false);

    const { suite } = props;
    useEffect(() => {
        if (!suite.loaded) {
            setTimeout(() => setIntroTimedout(true), 5000);
        } else {
            setIntroTimedout(true);
        }
    }, [suite.loaded]);

    const introLeaved = introTimedout && suite.loaded;

    const isDeviceInitialized = () => {
        return suite.device && suite.device.features && suite.device.features.initialized;
    };

    return (
        <StepWrapper data-test="onboarding_first_page">
            <CSSTransition
                {...TRANSITION_PROPS}
                in={!introLeaved}
                timeout={0}
                onExited={() => setIntroExited(true)}
            >
                <StepBodyWrapper>
                    <Logo viewBox="30 8 60 30" enableBackground="new 0 0 340 333" isAnimating>
                        <path
                            className="path"
                            fill="#FFFFFF"
                            stroke="#000000"
                            strokeWidth="0.4"
                            d="M70.3,14.2v-3.5c0-5.9-5-10.7-11.2-10.7c-6.2,0-11.2,4.8-11.2,10.7v3.5h-4.6v24.6h0l15.9,7.4l15.9-7.4h0V14.2H70.3z
                            M53.6,10.7c0-2.7,2.5-5,5.5-5c3,0,5.5,2.2,5.5,5v3.5H53.6V10.7z M68.6,34.7l-9.5,4.4l-9.5-4.4V20h19V34.7z"
                        />
                    </Logo>

                    <H1>
                        <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR} />
                    </H1>

                    <Loader>
                        Loading
                        <Dots maxCount={3} />
                    </Loader>
                </StepBodyWrapper>
            </CSSTransition>
            {/* {
                TODO: what if connect fails to load
                props.connectError && <Loader>Loading takes too long. But we are still trying. If the problem persist, contact Trezor support</Loader>
            } */}
            <CSSTransition {...TRANSITION_PROPS} in={introExited} timeout={1000}>
                <>
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
                </>
            </CSSTransition>
        </StepWrapper>
    );
};

export default WelcomeStep;
