/* @flow */

import React, { Component } from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import Button from 'components/Button';

import type { Props } from 'components/modals/index';

const Wrapper = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const StyledButton = styled(Button)`
    margin: 0 0 10px 0;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 0;
`;

class ForgetDevice extends Component<Props> {

    constructor(props: Props) {
        super(props);
        this.keyboardHandler = this.keyboardHandler.bind(this);
    }

    componentDidMount() {
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.foo(false);
        }
    }

    keyboardHandler: (event: KeyboardEvent) => void;

    foo(hidden: boolean) {
        const { modal } = this.props;
        if (!modal.opened) return;
        this.props.modalActions.onWalletTypeRequest(modal.device, hidden);
    }

    render() {
        if (!this.props.modal.opened) return null;
        const { device } = this.props.modal;
        // const { onCancel } = this.props.modalActions;
        return (
            <Wrapper>
                <H3>RequestWalletType for { device.instanceLabel }?</H3>
                <Row>
                    <StyledButton onClick={() => this.foo(false)}>Basic</StyledButton>
                    <StyledButton isWhite onClick={() => this.foo(true)}>Hidden</StyledButton>
                </Row>
            </Wrapper>
        );
    }
}

export default ForgetDevice;