import React from 'react';
import styled from 'styled-components';
import { Button, ButtonPin, InputPin } from '@trezor/components';

import { FormattedMessage } from 'react-intl';

import l10nMessages from './index.messages';

const Wrapper = styled.div`
    max-width: 240px;
    margin-left: auto;
    margin-right: auto;
`;

const InputWrapper = styled.div`
    margin-top: 12px;
    margin-bottom: 12px;
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

interface PinMatrixProps {
    onPinSubmit: (pin: string) => void;
}

interface PinMatrixState {
    pin: string;
}

class PinMatrix extends React.Component<PinMatrixProps> {
    state: PinMatrixState = {
        pin: '',
    };

    componentWillMount() {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    onPinAdd = (input: string) => {
        let { pin } = this.state;
        if (pin.length < 9) {
            pin += input;
            this.setState({
                pin,
            });
        }
    };

    onPinBackspace = () => {
        this.setState((previousState: PinMatrixState) => ({
            pin: previousState.pin.substring(0, previousState.pin.length - 1),
        }));
    };

    keyboardHandler(event: KeyboardEvent) {
        const { onPinSubmit } = this.props;
        const { pin } = this.state;

        event.preventDefault();
        switch (event.keyCode) {
            case 13:
                // enter,
                onPinSubmit(pin);
                break;
            // backspace
            case 8:
                this.onPinBackspace();
                break;

            // numeric and numpad
            case 49:
            case 97:
                this.onPinAdd('1');
                break;
            case 50:
            case 98:
                this.onPinAdd('2');
                break;
            case 51:
            case 99:
                this.onPinAdd('3');
                break;
            case 52:
            case 100:
                this.onPinAdd('4');
                break;
            case 53:
            case 101:
                this.onPinAdd('5');
                break;
            case 54:
            case 102:
                this.onPinAdd('6');
                break;
            case 55:
            case 103:
                this.onPinAdd('7');
                break;
            case 56:
            case 104:
                this.onPinAdd('8');
                break;
            case 57:
            case 105:
                this.onPinAdd('9');
                break;
            default:
                break;
        }
    }

    render() {
        const { onPinSubmit } = this.props;
        const { pin } = this.state;

        return (
            <Wrapper>
                <InputWrapper>
                    <InputPin value={pin} onDeleteClick={() => this.onPinBackspace()} />
                </InputWrapper>
                <PinRow>
                    <ButtonPin type="button" data-value="7" onClick={() => this.onPinAdd('7')} />
                    <ButtonPin type="button" data-value="8" onClick={() => this.onPinAdd('8')} />
                    <ButtonPin type="button" data-value="9" onClick={() => this.onPinAdd('9')} />
                </PinRow>
                <PinRow>
                    <ButtonPin type="button" data-value="4" onClick={() => this.onPinAdd('4')} />
                    <ButtonPin type="button" data-value="5" onClick={() => this.onPinAdd('5')} />
                    <ButtonPin type="button" data-value="6" onClick={() => this.onPinAdd('6')} />
                </PinRow>
                <PinRow>
                    <ButtonPin type="button" data-value="1" onClick={() => this.onPinAdd('1')} />
                    <ButtonPin type="button" data-value="2" onClick={() => this.onPinAdd('2')} />
                    <ButtonPin type="button" data-value="3" onClick={() => this.onPinAdd('3')} />
                </PinRow>

                <PinFooter>
                    <Button
                        type="button"
                        onClick={() => {
                            onPinSubmit(pin);
                            this.setState({ pin: '' });
                        }}
                    >
                        <FormattedMessage {...l10nMessages.TR_ENTER_PIN} />
                    </Button>
                    {/* <P isSmaller>
                        <FormattedMessage
                            {...l10nMessages.TR_NOT_SURE_HOW_PIN_WORKS}
                            values={{
                                TR_PIN_MANUAL_LINK: <Link isGreen href={PIN_MANUAL_URL}><FormattedMessage {...l10nMessages.TR_PIN_MANUAL_LINK} /></Link>,
                            }}
                        />
                    </P> */}
                </PinFooter>
            </Wrapper>
        );
    }
}

export default PinMatrix;
