import React, { PureComponent } from 'react';
import styled from 'styled-components';

import { H5, P, Loader, Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import commonMessages from '@suite-views/index.messages';
import modalsMessages from '../messages';
import messages from './messages';

// type Props = {
//     device: TrezorDevice,
//     instances: ?Array<TrezorDevice>,
//     onRememberDevice: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onRememberDevice'>,
//     onForgetDevice: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onForgetDevice'>,
// };

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

const Text = styled.div``;

const Column = styled.div`
    display: flex;
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

const StyledLoader = styled(Loader)`
    padding-left: 6px;
`;

const ButtonWithLoader = styled(Button)`
    padding-top: 6px;
    padding-bottom: 6px;
`;

interface Props {}

interface State {
    countdown: number;
    ticker?: number;
}

interface Instance {
    instanceLabel: string;
}

class RememberDevice extends PureComponent<Props, State> {
    constructor(props) {
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

    forget() {
        this.props.forgetDevice(this.props.device);
    }

    render() {
        const { device, instances, rememberDevice } = this.props;

        let { label } = device;
        const deviceCount = instances ? instances.length : 0;
        if (instances && instances.length > 0) {
            label = instances.map((instance: Instance) => instance.instanceLabel).join(',');
        }
        return (
            <Wrapper>
                <H5>
                    <FormattedMessage
                        {...modalsMessages.TR_FORGET_LABEL}
                        values={{
                            deviceLabel: label,
                        }}
                    />
                </H5>
                <StyledP size="small">
                    <FormattedMessage
                        {...messages.TR_WOULD_YOU_LIKE_TREZOR_WALLET_TO}
                        values={{
                            deviceCount,
                        }}
                    />
                </StyledP>
                <Column>
                    <ButtonWithLoader onClick={() => this.forget()}>
                        <ButtonContent>
                            <Text>
                                <FormattedMessage {...commonMessages.TR_FORGET_DEVICE} />
                            </Text>
                            <StyledLoader
                                isSmallText
                                isWhiteText
                                size={28}
                                text={this.state.countdown.toString()}
                            />
                        </ButtonContent>
                    </ButtonWithLoader>
                    <Button isWhite onClick={() => rememberDevice(device)}>
                        <FormattedMessage {...messages.TR_REMEMBER_DEVICE} />
                    </Button>
                </Column>
            </Wrapper>
        );
    }
}

export default RememberDevice;
