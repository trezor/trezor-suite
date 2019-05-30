/* @flow */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { H5, P, Loader, Button } from 'trezor-ui-components';
import { FormattedMessage } from 'react-intl';

import type { TrezorDevice } from 'flowtype';
import l10nCommonMessages from 'views/common.messages';
import l10nDeviceMessages from '../common.messages';
import l10nMessages from './index.messages';

import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice,
    instances: ?Array<TrezorDevice>,
    onRememberDevice: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onRememberDevice'>,
    onForgetDevice: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onForgetDevice'>,
};

type State = {
    countdown: number,
    ticker?: number,
};

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
        const deviceCount = instances ? instances.length : 0;
        if (instances && instances.length > 0) {
            label = instances.map(instance => instance.instanceLabel).join(',');
        }
        return (
            <Wrapper>
                <H5>
                    <FormattedMessage
                        {...l10nDeviceMessages.TR_FORGET_LABEL}
                        values={{
                            deviceLabel: label,
                        }}
                    />
                </H5>
                <StyledP size="small">
                    <FormattedMessage
                        {...l10nMessages.TR_WOULD_YOU_LIKE_TREZOR_WALLET_TO}
                        values={{
                            deviceCount,
                        }}
                    />
                </StyledP>
                <Column>
                    <ButtonWithLoader onClick={() => this.forget()}>
                        <ButtonContent>
                            <Text>
                                <FormattedMessage {...l10nCommonMessages.TR_FORGET_DEVICE} />
                            </Text>
                            <StyledLoader
                                isSmallText
                                isWhiteText
                                size={28}
                                text={this.state.countdown.toString()}
                            />
                        </ButtonContent>
                    </ButtonWithLoader>
                    <Button isWhite onClick={() => onRememberDevice(device)}>
                        <FormattedMessage {...l10nMessages.TR_REMEMBER_DEVICE} />
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
