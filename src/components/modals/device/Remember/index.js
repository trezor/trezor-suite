/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import Loader from 'components/Loader';
import Button from 'components/Button';

import type { Props } from './index';

type State = {
    countdown: number;
    ticker?: number;
}

const ButtonContent = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
`;

const StyledP = styled(P)`
    padding: 10px 0;
`;

const Wrapper = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const Text = styled.div`
    padding-right: 10px;
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledButton = styled(Button)`
    margin: 5px 0;
`;

const StyledLoader = styled(Loader)`
    position: absolute;
    left: 200px;
`;

export default class RememberDevice extends Component<Props, State> {
    keyboardHandler: (event: KeyboardEvent) => void;

    state: State;

    constructor(props: Props) {
        super(props);

        this.state = {
            countdown: 10,
        };
    }

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.forget();
        }
    }

    componentDidMount(): void {
        const ticker = () => {
            if (this.state.countdown - 1 <= 0) {
                // TODO: possible race condition,
                // device could be already connected but it didn't emit Device.CONNECT event yet
                window.clearInterval(this.state.ticker);
                if (this.props.modal.opened) {
                    this.props.modalActions.onForgetDevice(this.props.modal.device);
                }
            } else {
                this.setState({
                    countdown: this.state.countdown - 1,
                });
            }
        };

        this.setState({
            countdown: 10,
            ticker: window.setInterval(ticker, 1000),
        });

        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
        if (this.state.ticker) {
            window.clearInterval(this.state.ticker);
        }
    }

    forget() {
        if (this.props.modal.opened) {
            this.props.modalActions.onForgetDevice(this.props.modal.device);
        }
    }

    render() {
        if (!this.props.modal.opened) return null;
        const { device, instances } = this.props.modal;
        const { onForgetDevice, onRememberDevice } = this.props.modalActions;

        let label = device.label;
        const devicePlural: string = instances && instances.length > 1 ? 'devices or to remember them' : 'device or to remember it';
        if (instances && instances.length > 0) {
            label = instances.map((instance, index) => {
                let comma: string = '';
                if (index > 0) comma = ', ';
                return (
                    <span key={index}>{ comma }{ instance.instanceLabel }</span>
                );
            });
        }
        return (
            <Wrapper>
                <H3>Forget {label}?</H3>
                <StyledP isSmaller>Would you like TREZOR Wallet to forget your { devicePlural }, so that it is still visible even while disconnected?</StyledP>
                <Column>
                    <StyledButton onClick={() => this.forget()}>
                        <ButtonContent>
                            <Text>Forget</Text>
                            <StyledLoader
                                isSmallText
                                isWhiteText
                                size={28}
                                text={this.state.countdown.toString()}
                            />
                        </ButtonContent>
                    </StyledButton>
                    <StyledButton
                        isWhite
                        onClick={() => onRememberDevice(device)}
                    >Remember
                    </StyledButton>
                </Column>
            </Wrapper>
        );
    }
}