import React from 'react';
import styled from 'styled-components';
import { ButtonPin, Button, Icon } from '@trezor/components';

const Wrapper = styled.div`
    width: 260px;
    margin-left: auto;
    margin-right: auto;
`;

const Row = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    button {
        width: 30%;
        padding-bottom: 30%;
        margin: 1%;
    }
`;

const Backspace = styled(Button)`
    width: 95%;
    margin: 2%;
`;

interface BlindMatrixProps {
    count: 6 | 9;
    onSubmit: (arg0: any) => void;
}

class BlindMatrix extends React.Component<BlindMatrixProps> {
    componentWillMount() {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event: KeyboardEvent) {
        const { onSubmit, count } = this.props;
        event.preventDefault();
        if (event.keyCode === 8) {
            this.backspace();
        }
        if (count === 9) {
            switch (event.keyCode) {
                // numeric and numpad
                case 49:
                case 97:
                    onSubmit(1);
                    break;
                case 50:
                case 98:
                    onSubmit(2);
                    break;
                case 51:
                case 99:
                    onSubmit(3);
                    break;
                case 52:
                case 100:
                    onSubmit(4);
                    break;
                case 53:
                case 101:
                    onSubmit(5);
                    break;
                case 54:
                case 102:
                    onSubmit(6);
                    break;
                case 55:
                case 103:
                    onSubmit(7);
                    break;
                case 56:
                case 104:
                    onSubmit(8);
                    break;
                case 57:
                case 105:
                    onSubmit(9);
                    break;
                default:
                    break;
            }
        } else {
            switch (event.keyCode) {
                case 49:
                case 97:
                    onSubmit(1);
                    break;
                case 51:
                case 99:
                    onSubmit(3);
                    break;
                case 52:
                case 100:
                    onSubmit(4);
                    break;
                case 54:
                case 102:
                    onSubmit(6);
                    break;
                case 55:
                case 103:
                    onSubmit(7);
                    break;
                case 57:
                case 105:
                    onSubmit(9);
                    break;
                default:
                    break;
            }
        }
    }

    backspace() {
        this.props.onSubmit(String.fromCharCode(8));
    }

    render() {
        const { onSubmit } = this.props;

        return (
            <Wrapper>
                {this.props.count === 9 && (
                    <React.Fragment>
                        <Row>
                            <ButtonPin type="button" data-value="7" onClick={() => onSubmit(7)} />
                            <ButtonPin type="button" data-value="8" onClick={() => onSubmit(8)} />
                            <ButtonPin type="button" data-value="9" onClick={() => onSubmit(9)} />
                        </Row>
                        <Row>
                            <ButtonPin type="button" data-value="4" onClick={() => onSubmit(4)} />
                            <ButtonPin type="button" data-value="5" onClick={() => onSubmit(5)} />
                            <ButtonPin type="button" data-value="6" onClick={() => onSubmit(6)} />
                        </Row>
                        <Row>
                            <ButtonPin type="button" data-value="1" onClick={() => onSubmit(1)} />
                            <ButtonPin type="button" data-value="2" onClick={() => onSubmit(2)} />
                            <ButtonPin type="button" data-value="3" onClick={() => onSubmit(3)} />
                        </Row>
                    </React.Fragment>
                )}

                {this.props.count === 6 && (
                    <React.Fragment>
                        <Row>
                            <ButtonPin type="button" data-value="8" onClick={() => onSubmit(7)} />
                            <ButtonPin type="button" data-value="9" onClick={() => onSubmit(9)} />
                        </Row>
                        <Row>
                            <ButtonPin type="button" data-value="5" onClick={() => onSubmit(4)} />
                            <ButtonPin type="button" data-value="6" onClick={() => onSubmit(6)} />
                        </Row>
                        <Row>
                            <ButtonPin type="button" data-value="2" onClick={() => onSubmit(1)} />
                            <ButtonPin type="button" data-value="3" onClick={() => onSubmit(3)} />
                        </Row>
                    </React.Fragment>
                )}
                <Backspace isWhite onClick={() => this.backspace()}>
                    <Icon style={{ marginRight: '5px' }} icon="BACK" />
                    Backspace
                </Backspace>
            </Wrapper>
        );
    }
}

export default BlindMatrix;
