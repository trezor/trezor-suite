import React, { FormEvent } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Link, Input, Checkbox, P } from '@trezor/components';

import l10nCommonMessages from '@suite-support/Messages';
import { isEmail } from '@suite-utils/validators';
import { HAS_EMAIL_FLAG, addToFlags } from '@suite-utils/flags';
import { SOCIAL_FACEBOOK_URL, BLOG_URL, SOCIAL_TWITTER_URL } from '@onboarding-constants/urls';

import { Checkbox as CheckboxType } from '@onboarding-types/newsletter';
import { Wrapper, Text, OnboardingIcon, OnboardingButton, Loaders } from '@onboarding-components';
import { Props } from './Container';

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
class NewsleterStep extends React.Component<Props> {
    getBottomText() {
        return this.validateInput().bottomText;
    }

    getEmailStatus() {
        const { newsletter } = this.props;
        if (newsletter.isProgress) {
            return 'sending';
        }
        if (newsletter.isSuccess || newsletter.skipped) {
            return 'success';
        }
        if (newsletter.error) {
            return 'error';
        }
        return null;
    }

    getStatus() {
        const { newsletter } = this.props;
        if (newsletter.isSuccess || newsletter.skipped) {
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
            <Wrapper.Step>
                <Wrapper.StepHeading>
                    <FormattedMessage {...l10nMessages.TR_NEWSLETTER_HEADING} />
                </Wrapper.StepHeading>
                <Wrapper.StepBody>
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
                            {newsletter.isProgress && (
                                <Text>
                                    Subscribing
                                    <Loaders.Dots />
                                </Text>
                            )}
                            {newsletter.error && <Text>Subscribe failed</Text>}
                            {newsletter.isSuccess && <Text>Subscribe success!</Text>}

                            <CheckboxexSection>
                                {newsletter.checkboxes.map((checkbox: CheckboxType) => (
                                    <Wrapper.Checkbox key={checkbox.label}>
                                        <Checkbox
                                            isChecked={checkbox.value}
                                            onClick={() =>
                                                newsletterActions.toggleCheckbox(checkbox.label)
                                            }
                                        >
                                            <P>{checkbox.label}</P>
                                        </Checkbox>
                                    </Wrapper.Checkbox>
                                ))}
                            </CheckboxexSection>

                            <Wrapper.Controls>
                                <OnboardingButton.Alt onClick={() => this.skipEmail()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </OnboardingButton.Alt>
                                <OnboardingButton.Cta
                                    isDisabled={
                                        this.validateInput().state !== 'success' ||
                                        this.getEmailStatus() === 'sending'
                                    }
                                    onClick={this.submitEmail}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SUBMIT} />
                                </OnboardingButton.Cta>
                            </Wrapper.Controls>
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
                                    <OnboardingIcon.SocialLogo name="medium" sizeMultiplier={2} />
                                </Link>
                                <Link href={SOCIAL_FACEBOOK_URL}>
                                    <OnboardingIcon.SocialLogo name="facebook" sizeMultiplier={2} />
                                </Link>
                                <Link href={SOCIAL_TWITTER_URL}>
                                    <OnboardingIcon.SocialLogo name="twitter" sizeMultiplier={2} />
                                </Link>
                            </SocialWrapper>
                            <Wrapper.Controls>
                                <OnboardingButton.Cta onClick={() => this.goToNextStep()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </OnboardingButton.Cta>
                            </Wrapper.Controls>
                        </React.Fragment>
                    )}
                </Wrapper.StepBody>
            </Wrapper.Step>
        );
    }
}

export default NewsleterStep;
