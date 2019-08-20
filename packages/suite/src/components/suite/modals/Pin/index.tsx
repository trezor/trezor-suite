import React, { PureComponent } from 'react';
import styled from 'styled-components';

import { Button, ButtonPin, InputPin, P, H5, Link } from '@trezor/components';
import { TrezorDevice } from '@suite-types';

const ModalWrapper = styled.div`
    padding: 30px 45px;
    width: 356px;
`;

const InputWrapper = styled.div`
    margin-top: 24px;
    margin-bottom: 10px;
`;

const PinRow = styled.div`
    display: flex;
    justify-content: space-between;
    button {
        width: 30%;
        height: 0;
        padding-bottom: 30%;
    }

    & + & {
        margin-top: 10px;
    }
`;

const PinFooter = styled.div`
    margin: 20px 0 10px 0;
    display: flex;
    flex-direction: column;
`;

const TopMesssage = styled(P)``;

const BottomMessage = styled(P)`
    margin: 20px 30px 0;
`;

interface State {
    value: string;
}

interface Props {
    device: TrezorDevice;
    instances?: TrezorDevice[];
    onEnterPin: (device: TrezorDevice) => void;
}

class Pin extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            value: '',
        };
    }

    handleDelete() {
        this.setState(state => {
            return {
                value: state.value.slice(0, -1),
            };
        });
    }

    handlePinButton(index: number) {
        // TODO: get matrix from device
        this.setState(state => {
            return {
                value: `${state.value}${index}`,
            };
        });
    }

    render() {
        const { value } = this.state;

        return (
            <ModalWrapper>
                <H5>Enter Trezor PIN</H5>
                <TopMesssage size="small">The PIN layout is displayed on your Trezor.</TopMesssage>
                <InputWrapper>
                    <InputPin onDeleteClick={() => this.handleDelete()} value={value} />
                </InputWrapper>
                <PinRow>
                    <ButtonPin onClick={() => this.handlePinButton(1)} />
                    <ButtonPin onClick={() => this.handlePinButton(2)} />
                    <ButtonPin onClick={() => this.handlePinButton(3)} />
                </PinRow>
                <PinRow>
                    <ButtonPin onClick={() => this.handlePinButton(4)} />
                    <ButtonPin onClick={() => this.handlePinButton(5)} />
                    <ButtonPin onClick={() => this.handlePinButton(6)} />
                </PinRow>
                <PinRow>
                    <ButtonPin onClick={() => this.handlePinButton(7)} />
                    <ButtonPin onClick={() => this.handlePinButton(8)} />
                    <ButtonPin onClick={() => this.handlePinButton(9)} />
                </PinRow>
                <PinFooter>
                    <Button onClick={() => this.props.onEnterPin(this.props.device)}>
                        Enter PIN
                    </Button>
                    <BottomMessage size="small">
                        Not sure how PIN works?{' '}
                        <Link href="https://wiki.trezor.io/User_manual:Entering_PIN" isGreen>
                            Learn more
                        </Link>
                    </BottomMessage>
                </PinFooter>
            </ModalWrapper>
        );
    }
}

export default Pin;
