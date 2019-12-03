import React, { FormEvent } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { Input, Checkbox } from '@trezor/components';
import { Link, P } from '@trezor/components-v2';

import messages from '@suite/support/messages';
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
const NewsleterStep = (props: Props) => {
    const { newsletter, newsletterActions, device } = props;

    if (!device || !device.features) {
        return null;
    }

    const getEmailStatus = () => {
        const { newsletter } = props;
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
    };

    const getStatus = () => {
        const { newsletter } = props;
        if (newsletter.isSuccess || newsletter.skipped) {
            return 'socials';
        }
        return 'initial';
    };

    const validateInput = (): { state: 'error' | 'success' | undefined; bottomText?: string } => {
        const { email } = props.newsletter;
        if (!email) {
            return { state: undefined };
        }
        if (!isEmail(email)) {
            return {
                state: 'error',
                bottomText: props.intl.formatMessage(l10nMessages.TR_WRONG_EMAIL_FORMAT),
            };
        }
        return { state: 'success' };
    };

    const getBottomText = () => {
        return validateInput().bottomText;
    };

    const handleInputChange = (event: FormEvent<HTMLInputElement>) => {
        event.preventDefault();
        props.newsletterActions.setEmail(event.currentTarget.value);
    };

    const goToNextStep = () => {
        props.connectActions.callActionAndGoToNextStep(() =>
            props.connectActions.applyFlags({
                flags: addToFlags(HAS_EMAIL_FLAG, device.features.flags),
            }),
        );
    };

    const submitEmail = () => {
        props.newsletterActions.submitEmail();
    };

    const skipEmail = () => {
        props.newsletterActions.setSkipped();
    };

    const status = getStatus();

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <Translation>{l10nMessages.TR_NEWSLETTER_HEADING}</Translation>
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {status === 'initial' && (
                    <>
                        <Text>
                            <Translation>{l10nMessages.TR_NEWSLETTER_SUBHEADING}</Translation>
                        </Text>
                        <InputWrapper>
                            <Input
                                value={newsletter.email}
                                placeholder="Email"
                                state={validateInput().state}
                                bottomText={getBottomText()}
                                onChange={handleInputChange}
                                isDisabled={getEmailStatus() === 'sending'}
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
                            <OnboardingButton.Alt onClick={() => skipEmail()}>
                                <Translation>{messages.TR_SKIP}</Translation>
                            </OnboardingButton.Alt>
                            <OnboardingButton.Cta
                                isDisabled={
                                    validateInput().state !== 'success' ||
                                    getEmailStatus() === 'sending'
                                }
                                onClick={submitEmail}
                            >
                                <Translation>{messages.TR_SUBMIT}</Translation>
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {status === 'socials' && (
                    <>
                        {!newsletter.skipped && (
                            <Text>
                                <Translation>{l10nMessages.TR_THANK_YOU_FOR_EMAIL}</Translation>
                            </Text>
                        )}
                        {newsletter.skipped && (
                            <Text>
                                <Translation>{l10nMessages.TR_EMAIL_SKIPPED}</Translation>
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
                            <OnboardingButton.Cta onClick={() => goToNextStep()}>
                                <Translation>{messages.TR_CONTINUE}</Translation>
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default NewsleterStep;
