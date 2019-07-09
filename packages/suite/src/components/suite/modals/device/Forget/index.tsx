import React, { PureComponent } from 'react';
import styled from 'styled-components';

import { TrezorDevice } from '@suite-types/index';

import { H5, P, Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import l10nCommonMessages from '@suite-views/index.messages';
import l10nDeviceMessages from '../messages';
import l10nMessages from './messages';

interface Props {
    device: TrezorDevice;
}

const Wrapper = styled.div`
    width: 360px;
    padding: 30px 48px;
`;

const StyledP = styled(P)`
    && {
        padding: 20px 0px;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

class ForgetDevice extends PureComponent<Props> {
    componentDidMount() {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event: KeyboardEvent) {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.forget();
        }
    }

    forget() {
        this.props.forgetDevice(this.props.device);
    }

    render() {
        return (
            <Wrapper>
                <H5>
                    <FormattedMessage
                        {...l10nDeviceMessages.TR_FORGET_LABEL}
                        values={{
                            deviceLabel: this.props.device.instanceLabel,
                        }}
                    />
                </H5>
                <StyledP size="small">
                    <FormattedMessage
                        {...l10nMessages.TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM}
                    />
                </StyledP>
                <Row>
                    <Button onClick={() => this.forget()}>
                        <FormattedMessage {...l10nCommonMessages.TR_FORGET_DEVICE} />
                    </Button>
                    <Button isWhite onClick={this.props.onCancel}>
                        <FormattedMessage {...l10nMessages.TR_DONT_FORGET} />
                    </Button>
                </Row>
            </Wrapper>
        );
    }
}

export default ForgetDevice;
