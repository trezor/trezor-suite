/* eslint-disable react/no-unused-prop-types */

import { ReactNode } from 'react';

import styled from 'styled-components';

import { Button, CollapsibleBox, colors, Icon, IconProps, variables } from '@trezor/components';
import { isFirefox } from '@trezor/env-utils';

const WhiteCollapsibleBox = styled(CollapsibleBox)`
    background: ${({ theme }) => theme.BG_WHITE};
    width: 500px;
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
    icon: IconProps['icon'];
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
                icon: 'COOKIE',
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
                icon: 'FINGERPRINT',
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
                icon: 'COOKIE',
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
                icon: 'FINGERPRINT',
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
            icon: 'QUESTION',
            title: 'Action not completed',
            detail: {
                steps: [<Step>{props.message}</Step>],
            },
        });
    }

    if (['core-missing', 'core-failed-to-load'].includes(props.detail)) {
        tips.push({
            icon: 'QUESTION',
            title: 'Tried to access connect core which is not loaded yet',
            detail: {
                steps: [<Step>Try again or contact developers</Step>],
            },
        });
    }

    if (!tips.length) {
        tips.push({
            icon: 'QUESTION',
            title: 'Could not communicate with the host website',
            detail: {
                steps: [<Step>Please make sure Ad-blocker is not active</Step>],
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
    color: ${colors.TYPE_RED};
    font-size: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Text = styled.div`
    color: ${colors.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const TipsContainer = styled.div`
    margin-top: 40px;
`;

const StyledIcon = styled(Icon)`
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background-color: #c4c4c4;
    margin-right: 12px;
`;

const Heading = styled.div`
    display: flex;
`;

const HeadingText = styled.div`
    display: flex;
    align-items: center;
`;

const HeadingH1 = styled.div`
    color: ${colors.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 4px;
`;

export const ErrorView = (props: ErrorViewProps) => {
    const tips = getTroubleshootingTips(props);

    return (
        <View data-test="@connect-ui/error">
            <InnerWrapper>
                <H>Error</H>

                {/* response error event is just something that went wrong. we don't show any steps here. we only abuse steps UI but there is nothing to follow */}
                {props.detail !== 'response-event-error' && (
                    <Text>You can try the following steps to solve the problem</Text>
                )}

                <TipsContainer>
                    {tips.map(tip => (
                        <WhiteCollapsibleBox
                            opened={tips.length === 1}
                            key={tip.title}
                            heading={
                                <Heading>
                                    <StyledIcon icon={tip.icon} color="#000" />
                                    <HeadingText>
                                        <HeadingH1>{tip.title}</HeadingH1>
                                    </HeadingText>
                                </Heading>
                            }
                            variant="large"
                            noContentPadding
                        >
                            <StepsList>
                                {tip.detail.steps.map((step, index) => (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <li key={index}>{step}</li>
                                ))}
                            </StepsList>
                        </WhiteCollapsibleBox>
                    ))}
                </TipsContainer>

                <Button
                    data-test="@connect-ui/error-close-button"
                    variant="primary"
                    onClick={() => window.close()}
                >
                    Close
                </Button>
            </InnerWrapper>
        </View>
    );
};
