import React, { Component } from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import Button from 'components/buttons/Button';

const Remember = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const StyledP = styled(P)`
    padding: 14px 0px;
`;

const StyledButton = styled(Button)`
    margin: 0 0 10px 0;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 0;
`;

class ForgetDevice extends Component {
    componentDidMount() {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.forget();
        }
    }

    forget() {
        if (this.props.modal.opened) {
            this.props.modalActions.onForgetSingleDevice(this.props.modal.device);
        }
    }

    render() {
        if (!this.props.modal.opened) return null;
        const { device } = this.props.modal;
        const { onCancel } = this.props.modalActions;
        return (
            <Remember>
                <H3>Forget { device.instanceLabel } ?</H3>
                <StyledP isSmaller>Forgetting only removes the device from the list on the left, your coins are still safe and you can access them by reconnecting your TREZOR again.</StyledP>
                <Row>
                    <StyledButton onClick={() => this.forget()} text="Forget" />
                    <StyledButton isWhite onClick={onCancel} text="Don't forget" />
                </Row>
            </Remember>
        );
    }
}

export default ForgetDevice;