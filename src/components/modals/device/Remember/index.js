/* @flow */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import Loader from 'components/Loader';
import Button from 'components/Button';

import type { TrezorDevice } from 'flowtype';
import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice;
    instances: ?Array<TrezorDevice>;
    onRememberDevice: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onRememberDevice'>;
    onForgetDevice: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onForgetDevice'>;
}

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
    padding: 20px 0;
`;

const Wrapper = styled.div`
    width: 360px;
    padding: 30px 48px;
`;

const Text = styled.div`
    padding-right: 10px;
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;

    Button + Button {
        margin-top: 10px;
    }
`;

const StyledLoader = styled(Loader)`
    position: absolute;
    left: 200px;
`;

class RememberDevice extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            countdown: 10,
        };
    }

    componentDidMount(): void {
        const ticker = () => {
            if (this.state.countdown - 1 <= 0) {
                // TODO: possible race condition,
                // device could be already connected but it didn't emit Device.CONNECT event yet
                window.clearInterval(this.state.ticker);
                this.props.onForgetDevice(this.props.device);
            } else {
                this.setState(previousState => ({
                    countdown: previousState.countdown - 1,
                }));
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

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.forget();
        }
    }

    keyboardHandler: (event: KeyboardEvent) => void;

    forget() {
        this.props.onForgetDevice(this.props.device);
    }

    render() {
        const { device, instances, onRememberDevice } = this.props;

        let { label } = device;
        const devicePlural: string = instances && instances.length > 1 ? 'devices or to remember them' : 'device or to remember it';
        if (instances && instances.length > 0) {
            label = instances.map((instance, index) => {
                let comma: string = '';
                if (index > 0) comma = ', ';
                return (
                    <span key={instance.instanceLabel}>{ comma }{ instance.instanceLabel }</span>
                );
            });
        }
        return (
            <Wrapper>
                <H3>Forget {label}?</H3>
                <StyledP isSmaller>Would you like Trezor Wallet to forget your { devicePlural }, so that it is still visible even while disconnected?</StyledP>
                <Column>
                    <Button onClick={() => this.forget()}>
                        <ButtonContent>
                            <Text>Forget</Text>
                            <StyledLoader
                                isSmallText
                                isWhiteText
                                size={28}
                                text={this.state.countdown.toString()}
                            />
                        </ButtonContent>
                    </Button>
                    <Button
                        isWhite
                        onClick={() => onRememberDevice(device)}
                    >Remember
                    </Button>
                </Column>
            </Wrapper>
        );
    }
}

RememberDevice.propTypes = {
    device: PropTypes.object.isRequired,
    instances: PropTypes.array.isRequired,
    onRememberDevice: PropTypes.func.isRequired,
    onForgetDevice: PropTypes.func.isRequired,
};

export default RememberDevice;