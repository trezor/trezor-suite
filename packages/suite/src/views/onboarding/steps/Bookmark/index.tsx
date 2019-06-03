import React from 'react';
import styled from 'styled-components';
import { Flags } from 'trezor-flags';
import Platform from '@suite/utils/onboarding/Platform';

import { Link, Button, P } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { APPLY_FLAGS } from '@suite/actions/onboarding/constants/calls';
import l10nCommonMessages from '@suite/support/commonMessages';
import { PHISHING_URL } from '@suite/config/onboarding/urls';
import Key from '@suite/components/onboarding/Key';
import Text from '@suite/components/onboarding/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';
import { ConnectReducer, ConnectActions } from '@suite/types/onboarding/connect';

import l10nMessages from './index.messages';

const Keys = styled.div`
    display: flex;
`;

interface Props {
    device: ConnectReducer['device'];
    connectActions: ConnectActions;
}

interface State {
    keys: { [index: number]: boolean };
}
type keydown = 'keydown';

class BookmarkStep extends React.Component<Props, State> {
    static readonly TARGET_FLAG = 'hasBookmark';

    static readonly D_KEY = 68;

    static readonly CTRL_KEYS_WIN = [17];

    static readonly CTRL_KEYS_MAC = [91, 93];

    state: State = {
        keys: {},
    };

    componentWillMount() {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
        window.addEventListener('keyup', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
        window.removeEventListener('keyup', this.keyboardHandler, false);
    }

    setBookmarkFlagAndContinue() {
        const flags = Flags.setFlag(BookmarkStep.TARGET_FLAG, this.props.device.features.flags);
        this.props.connectActions.callActionAndGoToNextStep(APPLY_FLAGS, { flags });
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
        const ctrlKeys = Platform.isMac() ? BookmarkStep.CTRL_KEYS_MAC : BookmarkStep.CTRL_KEYS_WIN;
        return !keys[BookmarkStep.D_KEY] || !ctrlKeys.find(key => keys[key] === true);
    }

    render() {
        const { keys } = this.state;
        const ctrlKeys = Platform.isMac() ? BookmarkStep.CTRL_KEYS_MAC : BookmarkStep.CTRL_KEYS_WIN;

        return (
            <StepWrapper>
                <StepHeadingWrapper>
                    <FormattedMessage {...l10nMessages.TR_BOOKMARK_HEADING} />
                </StepHeadingWrapper>
                <StepBodyWrapper>
                    <Text>
                        <FormattedMessage
                            {...l10nMessages.TR_BOOKMARK_SUBHEADING}
                            values={{
                                TR_PHISHING_ATTACKS: (
                                    <Link isGreen href={PHISHING_URL}>
                                        <FormattedMessage {...l10nMessages.TR_PHISHING_ATTACKS} />
                                    </Link>
                                ),
                            }}
                        />
                    </Text>

                    {!Platform.isMobile() && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_USE_THE_KEYBOARD_SHORTCUT} />
                            </Text>
                            <Keys>
                                <Key
                                    isPressed={Boolean(ctrlKeys.find(key => keys[key] === true))}
                                    text={Platform.isMac() ? '⌘' : 'Ctrl'}
                                />
                                <P> + </P>
                                <Key isPressed={keys[BookmarkStep.D_KEY] === true} text="D" />
                            </Keys>
                        </React.Fragment>
                    )}

                    <ControlsWrapper>
                        {!Platform.isMobile() && (
                            <React.Fragment>
                                <Button isWhite onClick={() => this.setBookmarkFlagAndContinue()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </Button>
                                <Button
                                    isDisabled={this.nextDisabled()}
                                    onClick={() => this.setBookmarkFlagAndContinue()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </Button>
                            </React.Fragment>
                        )}
                        {/*  todo: for mobile add to homescreen */}
                        {Platform.isMobile() && (
                            <React.Fragment>
                                <Button isWhite onClick={() => this.setBookmarkFlagAndContinue()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </Button>
                                <Button onClick={() => this.setBookmarkFlagAndContinue()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </Button>
                            </React.Fragment>
                        )}
                    </ControlsWrapper>
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default BookmarkStep;
