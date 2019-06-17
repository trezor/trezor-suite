import React from 'react';
import styled, { css } from 'styled-components';
import { Button, H1, P } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { Dots } from '@suite/components/onboarding/Loaders';
import Text from '@suite/components/onboarding/Text';
import {
    StepBodyWrapper,
    StepWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';
import { State } from '@suite/types/suite';
import { SKIP_URL } from '@suite/constants/onboarding/urls';
import { goToNextStep } from '@suite/actions/onboarding/onboardingActions';
import l10nMessages from './index.messages';

const ANIMATION_DURATION = 2.5;

interface LogoProps {
    isConnectLoaded: boolean;
}

const Logo = styled.svg<LogoProps>`
    display: block;
    margin: 0 auto;
    width: 200px;
    height: 200px;
    opacity: 1;

    /* prevent animation on lang change */
    ${({ isConnectLoaded }) =>
        !isConnectLoaded
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

const FadeInWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    animation: fadeIn 0.5s linear;
    text-align: center;

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

interface Props {
    onboardingActions: {
        goToNextStep: typeof goToNextStep;
    };
    suite: State['suite'];
}

class WelcomeStep extends React.PureComponent<Props, {}> {
    render() {
        return (
            <StepWrapper data-test="onboarding_first_page">
                <StepBodyWrapper>
                    <Logo
                        viewBox="30 8 60 30"
                        enableBackground="new 0 0 340 333"
                        isConnectLoaded={this.props.suite.transport !== null}
                    >
                        <path
                            className="path"
                            fill="#FFFFFF"
                            stroke="#000000"
                            strokeWidth="0.4"
                            d="M70.3,14.2v-3.5c0-5.9-5-10.7-11.2-10.7c-6.2,0-11.2,4.8-11.2,10.7v3.5h-4.6v24.6h0l15.9,7.4l15.9-7.4h0V14.2H70.3z
                        M53.6,10.7c0-2.7,2.5-5,5.5-5c3,0,5.5,2.2,5.5,5v3.5H53.6V10.7z M68.6,34.7l-9.5,4.4l-9.5-4.4V20h19V34.7z"
                        />
                    </Logo>

                    {!this.props.suite.loaded && (
                        <Loader>
                            Loading
                            <Dots maxCount={3} />
                        </Loader>
                    )}

                    {/* {
                        this.props.connectError && <Loader>Loading takes too long. But we are still trying. If the problem persist, contact Trezor support</Loader>
                    } */}

                    {this.props.suite.loaded && (
                        <FadeInWrapper>
                            <H1>
                                <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR} />
                            </H1>

                            <Text>
                                <FormattedMessage {...l10nMessages.TR_WELCOME_TO_TREZOR_TEXT} />
                            </Text>

                            <ControlsWrapper isVertical>
                                <Button
                                    data-test="button-continue"
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nMessages.TR_GET_STARTED} />
                                </Button>
                                <Button
                                    isWhite
                                    data-test="button-use-wallet"
                                    onClick={() => (window.location.href = SKIP_URL)}
                                >
                                    <FormattedMessage {...l10nMessages.TR_USE_WALLET_NOW} />
                                </Button>
                            </ControlsWrapper>
                        </FadeInWrapper>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default WelcomeStep;
