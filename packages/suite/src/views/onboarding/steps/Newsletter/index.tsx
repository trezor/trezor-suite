import React, { FormEvent } from 'react';
import styled from 'styled-components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import { Button, Link, Input, Checkbox, P } from '@trezor/components';

import {
    SOCIAL_FACEBOOK_URL,
    BLOG_URL,
    SOCIAL_TWITTER_URL,
} from '@suite/constants/onboarding/urls';
import { IconSocial } from '@suite/components/onboarding/Icons';
import { isEmail } from '@suite-utils/validators';
import { HAS_EMAIL_FLAG, addToFlags } from '@suite-utils/flags';
import { SUBMIT_EMAIL } from '@suite/actions/onboarding/constants/fetchCalls';
import Text from '@suite/components/onboarding/Text';
import l10nCommonMessages from '@suite-support/Messages';
import { callActionAndGoToNextStep, applyFlags } from '@onboarding-actions/connectActions';
import {
    setSkipped,
    setEmail,
    submitEmail,
    toggleCheckbox,
} from '@onboarding-actions/newsletterActions';

import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
    CheckboxWrapper,
} from '@suite/components/onboarding/Wrapper';

import { AppState } from '@suite-types';
import { Checkbox as CheckboxType } from '@onboarding-types/newsletter';

import l10nMessages from './index.messages';

const CheckboxexSection = styled.div`
    display: flex;
    flex-direction: column;
`;

const SocialWrapper = styled.div`
    display: flex;
    justify-content: space-around;
    margin-top: 30px;
    margin-bottom: 30px;
    & * {
        margin: auto 8px auto 8px;
    }
`;

// todo: currently the same InputWrapper used also in NameStep but wait for final design decision
const InputWrapper = styled.div`
    display: flex;
    align-items: flex-start;
    height: 70px;
`;

interface Props {
    fetchCall: AppState['onboarding']['fetchCall'];
    newsletter: AppState['onboarding']['newsletter'];
    device: AppState['onboarding']['connect']['device'];
    connectActions: {
        applyFlags: typeof applyFlags;
        callActionAndGoToNextStep: typeof callActionAndGoToNextStep;
    };
    newsletterActions: {
        submitEmail: typeof submitEmail;
        setEmail: typeof setEmail;
        toggleCheckbox: typeof toggleCheckbox;
        setSkipped: typeof setSkipped;
    };
}

class NewsleterStep extends React.Component<Props & InjectedIntlProps> {
    getBottomText() {
        return this.validateInput().bottomText;
    }

    getEmailStatus() {
        const { fetchCall, newsletter } = this.props;
        if (fetchCall.name === SUBMIT_EMAIL && fetchCall.isProgress) {
            return 'sending';
        }
        if ((fetchCall.name === SUBMIT_EMAIL && fetchCall.result) || newsletter.skipped) {
            return 'success';
        }
        if (fetchCall.name === SUBMIT_EMAIL && fetchCall.error) {
            return 'error';
        }
        return null;
    }

    getStatus() {
        const { fetchCall, newsletter } = this.props;
        if ((fetchCall.name === SUBMIT_EMAIL && fetchCall.result) || newsletter.skipped) {
            return 'socials';
        }
        return 'initial';
    }

    validateInput = (): { state: 'error' | 'success' | undefined; bottomText?: string } => {
        const { email } = this.props.newsletter;
        if (!email) {
            return { state: undefined };
        }
        if (!isEmail(email)) {
            return {
                state: 'error',
                bottomText: this.props.intl.formatMessage(l10nMessages.TR_WRONG_EMAIL_FORMAT),
            };
        }
        return { state: 'success' };
    };

    handleInputChange = (event: FormEvent<HTMLInputElement>) => {
        event.preventDefault();
        this.props.newsletterActions.setEmail(event.currentTarget.value);
    };

    goToNextStep = () => {
        this.props.connectActions.callActionAndGoToNextStep(() =>
            this.props.connectActions.applyFlags({
                flags: addToFlags(HAS_EMAIL_FLAG, this.props.device.features.flags),
            }),
        );
    };

    submitEmail = () => {
        this.props.newsletterActions.submitEmail();
    };

    skipEmail() {
        this.props.newsletterActions.setSkipped();
    }

    render() {
        const status = this.getStatus();
        const { newsletter, newsletterActions } = this.props;
        return (
            <StepWrapper>
                <StepHeadingWrapper>
                    <FormattedMessage {...l10nMessages.TR_NEWSLETTER_HEADING} />
                </StepHeadingWrapper>
                <StepBodyWrapper>
                    {status === 'initial' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_NEWSLETTER_SUBHEADING} />
                            </Text>
                            <InputWrapper>
                                <Input
                                    value={newsletter.email}
                                    placeholder="Email"
                                    state={this.validateInput().state}
                                    bottomText={this.getBottomText()}
                                    onChange={this.handleInputChange}
                                    isDisabled={this.getEmailStatus() === 'sending'}
                                />
                            </InputWrapper>

                            <CheckboxexSection>
                                {newsletter.checkboxes.map((checkbox: CheckboxType) => (
                                    <CheckboxWrapper key={checkbox.label}>
                                        <Checkbox
                                            isChecked={checkbox.value}
                                            onClick={() =>
                                                newsletterActions.toggleCheckbox(checkbox.label)
                                            }
                                        >
                                            <P>{checkbox.label}</P>
                                        </Checkbox>
                                    </CheckboxWrapper>
                                ))}
                            </CheckboxexSection>

                            <ControlsWrapper>
                                <Button isWhite onClick={() => this.skipEmail()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </Button>
                                <Button
                                    isDisabled={
                                        this.validateInput().state !== 'success' ||
                                        this.getEmailStatus() === 'sending'
                                    }
                                    onClick={this.submitEmail}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SUBMIT} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {status === 'socials' && (
                        <React.Fragment>
                            {!newsletter.skipped && (
                                <Text>
                                    <FormattedMessage {...l10nMessages.TR_THANK_YOU_FOR_EMAIL} />
                                </Text>
                            )}
                            {newsletter.skipped && (
                                <Text>
                                    <FormattedMessage {...l10nMessages.TR_EMAIL_SKIPPED} />
                                </Text>
                            )}
                            <SocialWrapper>
                                <Link href={BLOG_URL}>
                                    <IconSocial name="medium" sizeMultiplier={2} />
                                </Link>
                                <Link href={SOCIAL_FACEBOOK_URL}>
                                    <IconSocial name="facebook" sizeMultiplier={2} />
                                </Link>
                                <Link href={SOCIAL_TWITTER_URL}>
                                    <IconSocial name="twitter" sizeMultiplier={2} />
                                </Link>
                            </SocialWrapper>
                            <ControlsWrapper>
                                <Button onClick={() => this.goToNextStep()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default injectIntl(NewsleterStep);
