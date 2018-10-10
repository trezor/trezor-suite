/* @flow */

import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import Button from 'components/Button';
import { CONTEXT_DEVICE } from 'actions/constants/modal';

import type { Props } from '../../index';

const Wrapper = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const StyledP = styled(P)`
    padding: 7px 0px;
`;

const StyledButton = styled(Button)`
    margin: 0 0 10px 0;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 0;
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
        if (this.props.modal.context !== CONTEXT_DEVICE) return;
        this.props.modalActions.onForgetSingleDevice(this.props.modal.device);
    }

    render() {
        if (this.props.modal.context !== CONTEXT_DEVICE) return null;
        const { device } = this.props.modal;
        const { onCancel } = this.props.modalActions;
        return (
            <Wrapper>
                <H3>Forget { device.instanceLabel }?</H3>
                <StyledP isSmaller>Forgetting only removes the device from the list on the left, your coins are still safe and you can access them by reconnecting your TREZOR again.</StyledP>
                <Row>
                    <StyledButton onClick={() => this.forget()}>Forget</StyledButton>
                    <StyledButton isWhite onClick={onCancel}>Don&apos;t forget</StyledButton>
                </Row>
            </Wrapper>
        );
    }
}

export default ForgetDevice;