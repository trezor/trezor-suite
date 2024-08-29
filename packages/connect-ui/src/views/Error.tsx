/* eslint-disable react/jsx-key */
import { ReactNode } from 'react';

import styled from 'styled-components';

import { Button, CollapsibleBox, colors, Icon, IconName, variables } from '@trezor/components';
import { isFirefox } from '@trezor/env-utils';

const WhiteCollapsibleBox = styled(CollapsibleBox)`
    background: ${({ theme }) => theme.legacy.BG_WHITE};
    width: 500px;

    ${CollapsibleBox.Content} {
        padding: 0;
    }
`;

export interface ErrorViewProps {
    type: 'error';
    detail: // errors that might arise when using connect-ui with connect-popup
    | 'response-event-error' // Error coming from connect RESPONSE_EVENT
        | 'handshake-timeout' // communication was not established in a set time period
        | 'iframe-failure' // another (legacy) error, this is sent from popupManager (host) to popup. it means basically the same like handshake-timeout but we might be notified earlier
        | 'core-missing' // core was loaded correctly but became unavailable later
        | 'core-failed-to-load'; // dynamic import of core failed
    // future errors when using connect-ui in different contexts
    message?: string;
}

const StepsList = styled.ul`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    line-height: 24px;
`;

const Step = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: #545454;
`;

const Black = styled.span`
    color: #000;
`;
const Green = styled.span`
    color: #00854d;
`;

interface Tip {
    icon: IconName;
    title: string;
    detail: {
        steps: ReactNode[];
    };
}

const getTroubleshootingTips = (props: ErrorViewProps) => {
    const tips: Tip[] = [];

    if (props.detail === 'handshake-timeout') {
        if (isFirefox()) {
            tips.push({
                icon: 'cookie',
                title: 'Disable cookies',
                detail: {
                    steps: [
                        <Step>
                            Go to <Black>Settings</Black>
                        </Step>,
                        <Step>
                            Go to <Black>Privacy & Security</Black>,
                        </Step>,
                        <Step>
                            <Black>Custom</Black> tab
                        </Step>,
                        <Step>
                            Uncheck <Green>Cookies</Green>
                        </Step>,
                    ],
                },
            });

            tips.push({
                icon: 'biometric',
                title: 'Disable: Block Fingerprinting',
                detail: {
                    steps: [
                        <Step>
                            Go to <Black>Settings</Black>
                        </Step>,
                        <Step>
                            Go to <Black>Privacy & Security</Black>
                        </Step>,
                        <Step>
                            <Black>Enhanced Tracking Protection</Black> window
                        </Step>,
                        <Step>
                            uncheck <Green>Fingerprints</Green>
                        </Step>,
                    ],
                },
            });

            // hopefully chromium based
        } else {
            tips.push({
                icon: 'cookie',
                title: 'Disable cookies',
                detail: {
                    steps: [
                        <Step>
                            Go to <Black>Settings</Black>
                        </Step>,
                        <Step>
                            Go to <Black>Privacy & Security</Black>
                        </Step>,
                        <Step>
                            <Black>Cookies and other site data</Black> tab
                        </Step>,
                        <Step>
                            uncheck <Green>Block all cookies</Green>
                        </Step>,
                    ],
                },
            });

            // fallback, last resort tips
            tips.push({
                icon: 'biometric',
                title: 'Open site in “Incognito/Private mode”',
                detail: {
                    steps: [
                        <Step>
                            Go to <Black>File</Black>
                        </Step>,
                        <Step>
                            Open <Green>New Incognito/Private Window</Green>
                        </Step>,
                    ],
                },
            });
        }
    }

    if (props.detail === 'response-event-error') {
        tips.push({
            icon: 'question',
            title: 'Action not completed',
            detail: {
                steps: [<Step>{props.message}</Step>],
            },
        });
    }

    if (['core-missing', 'core-failed-to-load'].includes(props.detail)) {
        tips.push({
            icon: 'question',
            title: 'Tried to access connect core which is not loaded yet',
            detail: {
                steps: [<Step>Try again or contact developers</Step>],
            },
        });
    }

    if (!tips.length) {
        tips.push({
            icon: 'question',
            title: 'Could not communicate with the host website',
            detail: {
                steps: [
                    <Step>Please make sure Ad-blocker is not active</Step>,
                    <Step>
                        Try downloading and setting up{' '}
                        <a
                            href="https://suite.trezor.io/web/bridge/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Trezor Bridge
                        </a>{' '}
                        for the best experience
                    </Step>,
                ],
            },
        });
    }

    return tips;
};

const View = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
`;

const InnerWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const H = styled.h1`
    color: ${colors.legacy.TYPE_RED};
    font-size: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Text = styled.div`
    color: ${colors.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const TipsContainer = styled.div`
    margin-top: 40px;
    margin-bottom: 20px;
`;

const IconWrapper = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background-color: #c4c4c4;
    margin-right: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const Heading = styled.div`
    display: flex;
`;

const HeadingText = styled.div`
    display: flex;
    align-items: center;
`;

const HeadingH1 = styled.div`
    color: ${colors.legacy.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 4px;
`;

export const ErrorView = (props: ErrorViewProps) => {
    const tips = getTroubleshootingTips(props);

    return (
        <View data-testid="@connect-ui/error">
            <InnerWrapper>
                <H>Error</H>

                {/* response error event is just something that went wrong. we don't show any steps here. we only abuse steps UI but there is nothing to follow */}
                {props.detail !== 'response-event-error' && (
                    <Text>You can try the following steps to solve the problem</Text>
                )}

                <TipsContainer>
                    {tips.map(tip => (
                        <WhiteCollapsibleBox
                            isOpen={tips.length === 1}
                            key={tip.title}
                            heading={
                                <Heading>
                                    <IconWrapper>
                                        <Icon name={tip.icon} color="#000" />
                                    </IconWrapper>
                                    <HeadingText>
                                        <HeadingH1>{tip.title}</HeadingH1>
                                    </HeadingText>
                                </Heading>
                            }
                            paddingType="large"
                        >
                            <StepsList>
                                {tip.detail.steps.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))}
                            </StepsList>
                        </WhiteCollapsibleBox>
                    ))}
                </TipsContainer>

                <Button
                    data-testid="@connect-ui/error-close-button"
                    variant="primary"
                    onClick={() => window.closeWindow()}
                >
                    Close
                </Button>
            </InnerWrapper>
        </View>
    );
};
