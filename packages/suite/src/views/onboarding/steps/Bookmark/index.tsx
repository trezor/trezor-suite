import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { Link, P } from '@trezor/components';

import { HAS_BOOKMARK_FLAG, addToFlags } from '@suite-utils/flags';
import l10nCommonMessages from '@suite-support/Messages';
import { PHISHING_URL } from '@onboarding-constants/urls';
import { Wrapper, OnboardingButton, Key, Text } from '@suite/components/onboarding';
import l10nMessages from './index.messages';
import { Props } from './Container';

const Keys = styled.div`
    display: flex;
    align-items: center;
`;

interface StepState {
    keys: { [index: number]: boolean };
}

const D_KEY = 68;
const CTRL_KEYS_WIN = [17];
// const CTRL_KEYS_MAC = [91, 93];

class BookmarkStep extends React.Component<Props, StepState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            keys: {},
        };
    }

    UNSAFE_componentWillMount() {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
        window.addEventListener('keyup', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
        window.removeEventListener('keyup', this.keyboardHandler, false);
    }

    setBookmarkFlagAndContinue() {
        const { device } = this.props;
        if (!device || !device.features) return;
        const flags = addToFlags(HAS_BOOKMARK_FLAG, device.features.flags);
        this.props.connectActions.callActionAndGoToNextStep(() =>
            this.props.connectActions.applyFlags({ flags }),
        );
    }

    keyboardHandler(e: KeyboardEvent) {
        const { keys } = this.state;
        if (e.type === 'keydown') {
            keys[e.keyCode] = true;
        } else if (e.type === 'keyup') {
            keys[e.keyCode] = false;
        }
        this.setState({ keys });
    }

    nextDisabled() {
        const { keys } = this.state;
        // const ctrlKeys = Platform.isMac() ? BookmarkStep.CTRL_KEYS_MAC : BookmarkStep.CTRL_KEYS_WIN;
        const ctrlKeys = CTRL_KEYS_WIN;
        return !keys[D_KEY] || !ctrlKeys.find(key => keys[key] === true);
    }

    render() {
        const { keys } = this.state;
        // const ctrlKeys = Platform.isMac() ? BookmarkStep.CTRL_KEYS_MAC : BookmarkStep.CTRL_KEYS_WIN;
        const ctrlKeys = CTRL_KEYS_WIN;

        return (
            <Wrapper.Step>
                <Wrapper.StepHeading>
                    <Translation {...l10nMessages.TR_BOOKMARK_HEADING} />
                </Wrapper.StepHeading>
                <Wrapper.StepBody>
                    <Text>
                        <Translation
                            {...l10nMessages.TR_BOOKMARK_SUBHEADING}
                            values={{
                                TR_PHISHING_ATTACKS: (
                                    <Link href={PHISHING_URL}>
                                        <Translation {...l10nMessages.TR_PHISHING_ATTACKS} />
                                    </Link>
                                ),
                            }}
                        />
                    </Text>
                    {/* {!Platform.isMobile() && ( */}
                    <>
                        <Text>
                            <Translation {...l10nMessages.TR_USE_THE_KEYBOARD_SHORTCUT} />
                        </Text>
                        <Keys>
                            <Key
                                isPressed={Boolean(ctrlKeys.find(key => keys[key] === true))}
                                text="Ctrl"
                            />
                            <P> + </P>
                            <Key isPressed={keys[D_KEY] === true} text="D" />
                        </Keys>
                    </>
                    <Wrapper.Controls>
                        {/* {!Platform.isMobile() && ( */}
                        <>
                            <OnboardingButton.Alt onClick={() => this.setBookmarkFlagAndContinue()}>
                                <Translation {...l10nCommonMessages.TR_SKIP} />
                            </OnboardingButton.Alt>
                            <OnboardingButton.Cta
                                isDisabled={this.nextDisabled()}
                                onClick={() => this.setBookmarkFlagAndContinue()}
                            >
                                <Translation {...l10nCommonMessages.TR_CONTINUE} />
                            </OnboardingButton.Cta>
                        </>
                        {/* )} */}
                        {/*  todo: for mobile add to homescreen */}
                        {/* {Platform.isMobile() && (
                            <React.Fragment>
                                <Button variant="secondary" onClick={() => this.setBookmarkFlagAndContinue()} inlineWidth>
                                    <Translation {...l10nCommonMessages.TR_SKIP} />
                                </Button>
                                <Button onClick={() => this.setBookmarkFlagAndContinue()}>
                                    <Translation {...l10nCommonMessages.TR_CONTINUE} />
                                </Button>
                            </React.Fragment>
                        )} */}
                    </Wrapper.Controls>
                </Wrapper.StepBody>
            </Wrapper.Step>
        );
    }
}

export default BookmarkStep;
