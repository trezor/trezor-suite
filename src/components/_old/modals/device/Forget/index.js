import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import ButtonText from 'components/buttons/ButtonText';

const Wrapper = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const StyledP = styled(P)`
    padding: 7px 0px;
`;

const StyledButton = styled(ButtonText)`
    margin: 0 0 10px 0;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 0;
`;

class ForgetDevice extends PureComponent {
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
        this.props.onForgetSingleDevice(this.props.device);
    }

    render() {
        return (
            <Wrapper>
                <H3>Forget { this.props.device.instanceLabel }?</H3>
                <StyledP isSmaller>Forgetting only removes the device from the list on the left, your coins are still safe and you can access them by reconnecting your Trezor again.</StyledP>
                <Row>
                    <StyledButton onClick={() => this.forget()}>Forget</StyledButton>
                    <StyledButton isWhite onClick={this.props.onCancel}>Don&apos;t forget</StyledButton>
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