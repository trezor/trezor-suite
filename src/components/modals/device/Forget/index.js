/* @flow */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import Button from 'components/Button';
import { FormattedMessage } from 'react-intl';

import type { TrezorDevice } from 'flowtype';
import l10nDeviceMessages from '../common.messages';
import l10nMessages from './index.messages';

import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice;
    onForgetSingleDevice: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onForgetSingleDevice'>;
    onCancel: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>;
}

const Wrapper = styled.div`
    width: 360px;
    padding: 30px 48px;
`;

const StyledP = styled(P)`
    padding: 20px 0px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;

    Button + Button {
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

    keyboardHandler: (event: KeyboardEvent) => void;

    forget() {
        this.props.onForgetSingleDevice(this.props.device);
    }

    render() {
        return (
            <Wrapper>
                <H2>
                    <FormattedMessage
                        {...l10nDeviceMessages.TR_FORGET_LABEL}
                        values={{
                            deviceLabel: this.props.device.instanceLabel,
                        }}
                    />
                </H2>
                <StyledP isSmaller>
                    <FormattedMessage {...l10nMessages.TR_FORGETTING_ONLY_REMOVES_THE_DEVICE_FROM} />
                </StyledP>
                <Row>
                    <Button onClick={() => this.forget()}><FormattedMessage {...l10nDeviceMessages.TR_FORGET_DEVICE} /></Button>
                    <Button isWhite onClick={this.props.onCancel}><FormattedMessage {...l10nMessages.TR_DONT_FORGET} /></Button>
                </Row>
            </Wrapper>
        );
    }
}

ForgetDevice.propTypes = {
    device: PropTypes.object.isRequired,
    onForgetSingleDevice: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default ForgetDevice;