/* @flow */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { H5, Link, Button, P, ButtonPin, InputPin } from 'trezor-ui-components';
import { FormattedMessage } from 'react-intl';

import l10nCommonMessages from 'views/common.messages';
import type { TrezorDevice } from 'flowtype';
import l10nMessages from './index.messages';

import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice,
    onPinSubmit: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onPinSubmit'>,
};

type State = {
    pin: string,
};

const Wrapper = styled.div`
    padding: 30px 48px;
    max-width: 350px;
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

const StyledP = styled(P)`
    padding-top: 5px;
`;

const StyledLink = styled(Link)``;

const Footer = styled.div`
    margin: 20px 0 10px 0;
    display: flex;
    flex-direction: column;
`;

class Pin extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            pin: '',
        };
    }

    componentWillMount(): void {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    onPinAdd = (input: number): void => {
        let { pin } = this.state;
        if (pin.length < 9) {
            pin += input;
            this.setState({
                pin,
            });
        }
    };

    onPinBackspace = (): void => {
        this.setState(previousState => ({
            pin: previousState.pin.substring(0, previousState.pin.length - 1),
        }));
    };

    keyboardHandler(event: KeyboardEvent): void {
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
                this.onPinAdd(1);
                break;
            case 50:
            case 98:
                this.onPinAdd(2);
                break;
            case 51:
            case 99:
                this.onPinAdd(3);
                break;
            case 52:
            case 100:
                this.onPinAdd(4);
                break;
            case 53:
            case 101:
                this.onPinAdd(5);
                break;
            case 54:
            case 102:
                this.onPinAdd(6);
                break;
            case 55:
            case 103:
                this.onPinAdd(7);
                break;
            case 56:
            case 104:
                this.onPinAdd(8);
                break;
            case 57:
            case 105:
                this.onPinAdd(9);
                break;
            default:
                break;
        }
    }

    keyboardHandler: (event: KeyboardEvent) => void;

    render() {
        const { device, onPinSubmit } = this.props;
        const { pin } = this.state;
        return (
            <Wrapper>
                <H5>
                    <FormattedMessage
                        {...l10nMessages.TR_ENTER_PIN}
                        values={{ deviceLabel: device.label }}
                    />
                </H5>
                <P size="small">
                    <FormattedMessage {...l10nMessages.TR_THE_PIN_LAYOUT_IS_DISPLAYED_ON} />
                </P>
                <InputWrapper>
                    <InputPin value={pin} onDeleteClick={() => this.onPinBackspace()} />
                </InputWrapper>
                <PinRow>
                    <ButtonPin type="button" data-value="7" onClick={() => this.onPinAdd(7)} />
                    <ButtonPin type="button" data-value="8" onClick={() => this.onPinAdd(8)} />
                    <ButtonPin type="button" data-value="9" onClick={() => this.onPinAdd(9)} />
                </PinRow>
                <PinRow>
                    <ButtonPin type="button" data-value="4" onClick={() => this.onPinAdd(4)} />
                    <ButtonPin type="button" data-value="5" onClick={() => this.onPinAdd(5)} />
                    <ButtonPin type="button" data-value="6" onClick={() => this.onPinAdd(6)} />
                </PinRow>
                <PinRow>
                    <ButtonPin type="button" data-value="1" onClick={() => this.onPinAdd(1)} />
                    <ButtonPin type="button" data-value="2" onClick={() => this.onPinAdd(2)} />
                    <ButtonPin type="button" data-value="3" onClick={() => this.onPinAdd(3)} />
                </PinRow>
                <Footer>
                    <Button type="button" onClick={() => onPinSubmit(pin)}>
                        <FormattedMessage {...l10nMessages.TR_ENTER_PIN} />
                    </Button>
                    <StyledP size="small">
                        <FormattedMessage
                            {...l10nMessages.TR_NOT_SURE_HOW_PIN_WORKS}
                            values={{
                                TR_LEARN_MORE: (
                                    <StyledLink
                                        isGreen
                                        href="https://wiki.trezor.io/User_manual:Entering_PIN"
                                    >
                                        <FormattedMessage {...l10nCommonMessages.TR_LEARN_MORE} />
                                    </StyledLink>
                                ),
                            }}
                        />
                    </StyledP>
                </Footer>
            </Wrapper>
        );
    }
}

Pin.propTypes = {
    device: PropTypes.object.isRequired,
    onPinSubmit: PropTypes.func.isRequired,
};

export default Pin;
